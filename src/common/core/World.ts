import type { ISystem } from "#/common/core/ECS"
import { Component, Entity } from "#/common/core/ECS"
import { EntityTypes, SOL_PHYS } from "./SolConstants";
import { EntityConfig } from "../config/EntityConfig";
import RAPIER from "@dimforge/rapier3d-compat";
import { loadMap } from "./PhysicsFactory";
import type { Class } from "#/types/types";
import { TestComp, TestSystem, MovementSystem, PhysicsSystem, MovementComp } from "../modules";
import { SolVec3 } from "./SolMath";
import { AbilitySystem } from "../modules/ability/AbilitySystem";
import { StatusSystem } from "../modules/status/StatusSystem";
import { TransformSystem } from "../modules/transform/TransformSystem";

await RAPIER.init();

export class World {
    public readonly isServer: boolean;
    public entities = new Set();
    public stepCount = 0;
    private entityMasks: number[] = [];
    private componentPools = new Map<Function, Component[]>();
    private componentBits = new Map<Function, number>();
    private queries = new Map<number, EntityQuery>();
    private singletons = new Map<Function, any>();
    private nextBit = 0;
    private nextId = 1;
    public allSystems: ISystem[];
    private systems: {
        preUpdate: ISystem[],
        preStep: ISystem[],
        step: ISystem[],
        postStep: ISystem[],
        postUpdate: ISystem[]
    } = { preUpdate: [], preStep: [], step: [], postStep: [], postUpdate: [] };

    public physWorld = new RAPIER.World(SOL_PHYS.GRAVITY);


    constructor(isServer: boolean, addSystems: ISystem[] = []) {
        this.isServer = isServer;
        //this.physWorld.numSolverIterations = 4;
        //this.physWorld.timestep = SOL_PHYS.TIMESTEP * 2;

        this.allSystems = [
            new PhysicsSystem(this.physWorld),
            new TransformSystem(),
            new StatusSystem(),
            new MovementSystem(),
            new TestSystem(),
            new AbilitySystem(),
            ...addSystems
        ]
        for (const s of this.allSystems) {
            if (s.preUpdate) this.systems.preUpdate.push(s);
            if (s.preStep) this.systems.preStep.push(s);
            if (s.step) this.systems.step.push(s);
            if (s.postStep) this.systems.postStep.push(s);
            if (s.postUpdate) this.systems.postUpdate.push(s);
        }
    }

    async start() {
        return await loadMap(this.physWorld, "World0");
    }

    spawn(type: EntityTypes, overrides?: Partial<Record<string, any>>) {
        const overrideId = overrides?.["overrideId"];
        const entityId = overrideId ? overrideId : this.nextId++;
        const config = EntityConfig[type];
        this.entities.add(entityId);
        for (const c of config.components) {
            const component = this.add(entityId, c.type);
            if (c.data) Object.assign(component, c.data);

            if (overrides && overrides[c.type.name]) {
                Object.assign(component, overrides[c.type.name]);
            }
        }
        return entityId;
    }

    removeEntity(id: number) {
        if (!this.entities.has(id)) return;

        // 1. Get the mask to see what components this entity has
        const mask = this.entityMasks[id];

        // 2. Iterate through all known component types
        for (const [cls, bit] of this.componentBits) {
            // If the entity has this component bit, remove it
            if ((mask & bit) === bit) {
                this.removeComponent(id, cls as Class<Component>);
            }
        }

        // 3. System-specific cleanup (Crucial!)
        // Some systems need to know an entity is dying (e.g. to remove Rapier bodies)
        for (const system of this.allSystems) {
            if (system.removeEntity) system.removeEntity(this, id);
        }

        // 4. Final Wipe
        this.entities.delete(id);
        this.entityMasks[id] = 0;
    }

    private getComponentBit(compClass: Function) {
        if (!this.componentBits.has(compClass)) {
            this.componentBits.set(compClass, 1 << this.nextBit++);
        }
        return this.componentBits.get(compClass)!;
    }

    add<T extends Component>(entityId: number, input: (new () => T) | T): T {
        let component: T;
        const isConstructor = typeof input === 'function';
        const componentClass = isConstructor ? input : (input.constructor as Class<T>);

        // Check if it exists regardless of input type
        const existing = this.get(entityId, componentClass);
        if (existing && isConstructor) {
            return existing;
        }

        component = isConstructor ? new input() : input;
        component.entityId = entityId;
        this.addComponent(entityId, component);
        return component;
    }

    addComponent(entityId: number, comp: Component) {
        const type = comp.constructor;
        const bit = this.getComponentBit(type);

        if (!this.componentPools.has(type)) {
            this.componentPools.set(type, []);
        }
        this.componentPools.get(type)![entityId] = comp;

        this.entityMasks[entityId] = (this.entityMasks[entityId] || 0) | bit;

        const newMask = this.entityMasks[entityId];

        // Update cached queries so they include this entity
        for (const [signature, query] of this.queries) {
            if ((newMask & signature) === signature) {
                // Avoid duplicates
                if (!query.entities.includes(entityId)) {
                    query.entities.push(entityId);
                }
            }
        }
    }

    query(...componentClasses: Class<Component>[]) {
        let signature = 0;
        for (const cls of componentClasses) signature |= this.getComponentBit(cls);

        // If we've done this query before, return the pre-built list!
        if (this.queries.has(signature)) {
            return this.queries.get(signature)!.entities;
        }

        // First time? Do the expensive loop once
        const q = new EntityQuery(signature);
        for (let i = 0; i < this.entityMasks.length; i++) {
            const mask = this.entityMasks[i];
            if (mask && (mask & signature) === signature) q.entities.push(i);
        }
        this.queries.set(signature, q);
        return q.entities;
    }

    get<T extends Component>(entityId: number, componentClass: Class<T>): T | undefined {
        const pool = this.componentPools.get(componentClass);
        return pool ? (pool[entityId] as T) : undefined;
    }

    removeComponent(entityId: number, compClass: Class<Component>) {
        const bit = this.getComponentBit(compClass);
        const pool = this.componentPools.get(compClass);

        // 1. Delete the actual data
        if (pool) {
            // We use 'delete' to keep the array sparse and indices stable
            delete pool[entityId];
        }

        // 2. Update the bitmask
        const oldMask = this.entityMasks[entityId];
        this.entityMasks[entityId] &= ~bit;
        const newMask = this.entityMasks[entityId];

        // 3. Update Cached Queries
        for (const [signature, query] of this.queries) {
            const matchedOld = (oldMask & signature) === signature;
            const matchedNew = (newMask & signature) === signature;

            // If it used to match but no longer does, remove it
            if (matchedOld && !matchedNew) {
                const index = query.entities.indexOf(entityId);
                if (index !== -1) {
                    // "Swap and Pop" - $O(1)$
                    const lastIdx = query.entities.length - 1;
                    query.entities[index] = query.entities[lastIdx];
                    query.entities.pop();
                }
            }
        }
    }

    getSingleton<T>(cls: Class<T>): T {
        let instance = this.singletons.get(cls) as T;
        if (!instance) {
            instance = new cls();
            this.singletons.set(cls, instance);
        }
        return instance;
    }

    addSingleton<T>(...comp: T[]) {
        for (const c of comp) {
            this.singletons.set(c!.constructor, c);
        }
    }

    preUpdate(dt: number, time: number): void {
        const phase = this.systems.preUpdate;
        for (let i = 0; i < phase.length; i++) {
            phase[i].preUpdate!(this, dt, time);
        }
    }

    preStep(dt: number, time: number): void {
        const phase = this.systems.preStep;
        for (let i = 0; i < phase.length; i++) {
            phase[i].preStep!(this, dt, time);
        }
    }

    step(dt: number, time: number) {
        this.stepCount++;
        const phase = this.systems.step;
        for (let i = 0; i < phase.length; i++) {
            phase[i].step!(this, dt, time);
        }
    }

    postStep(dt: number, time: number): void {
        const phase = this.systems.postStep;
        for (let i = 0; i < phase.length; i++) {
            phase[i].postStep!(this, dt, time);
        }
    }

    postUpdate(dt: number, time: number, alpha: number): void {
        const phase = this.systems.postUpdate;
        for (let i = 0; i < phase.length; i++) {
            phase[i].postUpdate!(this, dt, time, alpha);
        }
    }

}

class EntityQuery {
    public entities: number[] = [];
    constructor(public signature: number) { }
}