import type { ISystem } from "#/common/core/ECS"
import { Component } from "#/common/core/ECS"
import { EntityTypes, NetworkRole, SOL_PHYS } from "./SolConstants";
import { EntityConfig } from "../config/EntityConfig";
import { loadMap } from "./PhysicsFactory";
import type { Class } from "#/types/types";

import { AbilitySystem } from "../modules/ability/AbilitySystem";
import { StatusSystem } from "../modules/status/StatusSystem";
import { TransformSystem } from "../modules/transform/TransformSystem";
import { PossessSystem } from "#/common/modules/user/PossessSystem";
import { InputSystem } from "../modules/user/InputSystem";

import RAPIER from "@dimforge/rapier3d-compat"
import { CompReg, Comps, type CompInstanceMap } from "./ECSRegi";
import { PhysicsSystem } from "../modules/physics/PhysicsSystem";
import { MovementSystem } from "../modules/movement/MovementSystem";
import { MetadataComp } from "../modules/meta/MetadataComp";
await RAPIER.init();

class EntityQuery {
    public entities: number[] = [];
    constructor(public signature: number) { }
}

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
        this.addSingleton(this.physWorld);

        this.allSystems = [
            new InputSystem(),
            new PhysicsSystem(this.physWorld),
            new TransformSystem(),
            new PossessSystem(),
            new MovementSystem(),
            //new StatusSystem(),
            //new AbilitySystem(),
            //new TestSystem(),
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
        await loadMap(this.physWorld, "World0");
    }

    findNewId() {
        // If we are the server, we start at 1000 to leave room for client local entities
        // if (this.isServer && this.nextId < 1000) {
        //     this.nextId = 1000;
        // }

        while (this.entities.has(this.nextId)) {
            this.nextId++;
        }
        return this.nextId;
    }

    spawn(role: NetworkRole, type?: EntityTypes, id?: number, overrides?: Partial<Record<string, any>>) {
        let entityId = id !== undefined ? id : this.findNewId();
        this.entities.add(entityId);
        this.add(entityId, new MetadataComp(type, true));
        switch (role) {
            case NetworkRole.LOCAL:
                this.add(entityId, Comps.Local).stepCount = this.stepCount;
                break;
            case NetworkRole.REMOTE:
                this.add(entityId, Comps.Remote).lastSeenServerTime = Date.now();
                break;
            case NetworkRole.AUTHORITY:
                this.add(entityId, Comps.Authority);
                break;
        }
        if (type !== undefined) {
            const config = EntityConfig[type];
            for (const c of config.components) {
                if (this.isServer && !(c.type as any).domain) continue;
                const component = this.add(entityId, c.type);
                if (c.data) Object.assign(component, c.data);

                if (overrides && overrides[c.type.name]) {
                    Object.assign(component, overrides[c.type.name]);
                }
            }
        }
        return entityId;
    }

    removeEntity(id: number) {
        if (!this.entities.has(id)) return;

        for (const system of this.allSystems) {
            if (system.removeEntity) system.removeEntity(this, id);
        }

        // 1. Get the mask to see what components this entity has
        const mask = this.entityMasks[id];

        // 2. Iterate through all known component types
        for (const [cls, bit] of this.componentBits) {
            // If the entity has this component bit, remove it
            if ((mask & bit) === bit) {
                this.removeComponent(id, cls as Class<Component>);
            }
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

    add<K extends Comps>(entityId: number, input: K | (new () => Component) | Component): CompInstanceMap[K] {
        let component: any;
        let componentClass: any;

        if (typeof input === 'number') {
            // Handle Enum
            componentClass = CompReg[input];
            const existing = this.get(entityId, componentClass);
            if (existing) return existing as CompInstanceMap[K];
            component = new componentClass();
        } else if (typeof input === 'function') {
            // Handle Constructor: new TransformComp()
            componentClass = input;
            component = new input();
        } else {
            // Handle Instance: world.add(id, new Physics({ mass: 10 }))
            componentClass = input.constructor;
            component = input;
        }

        if ('entityId' in component) component.entityId = entityId;

        this.addComponent(entityId, component);
        return component as CompInstanceMap[K];
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

    query(comps: Comps[]): number[] {
        let signature = 0;

        // Map enums to bits via the registry
        for (let i = 0; i < comps.length; i++) {
            const cls = CompReg[comps[i]];
            signature |= this.getComponentBit(cls);
        }

        const cached = this.queries.get(signature);
        if (cached) return cached.entities;

        const q = new EntityQuery(signature);
        const len = this.entityMasks.length;

        for (let i = 0; i < len; i++) {
            const mask = this.entityMasks[i];
            // Standard bitmask inclusion check
            if (mask !== undefined && (mask & signature) === signature) {
                q.entities.push(i);
            }
        }

        this.queries.set(signature, q);
        return q.entities;
    }

    has(id: number, comps: Comps[]) {
        if (!this.entities.has(id)) return false;
        let signature = 0;
        for (let i = 0; i < comps.length; i++) {
            const cls = CompReg[comps[i]];
            signature |= this.getComponentBit(cls);
        }

        const mask = this.entityMasks[id];
        if (mask && (mask & signature) === signature) {
            return true;
        }
        return false;
    }

    get<T extends Component>(entityId: number, componentClass: Class<T>): T | undefined {
        const pool = this.componentPools.get(componentClass);
        return pool ? (pool[entityId] as T) : undefined;
    }

    getComp<K extends Comps>(id: number, comp: K): CompInstanceMap[K] | undefined {
        const pool = this.componentPools.get(CompReg[comp]);
        return pool ? (pool[id] as CompInstanceMap[K]) : undefined;
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

    addSingleton(...comp: any[]) {
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