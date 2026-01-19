import type { ISystem } from "../modules/System";
import { Component } from "../modules/Component";
import { EntityTypes, SOL_PHYS } from "./SolConstants";
import { EntityConfig } from "../config/EntityConfig";
import RAPIER from "@dimforge/rapier3d-compat";
import { loadMap } from "./PhysicsFactory";
import type { Class } from "@/types/types";
import { TestComp, TestSystem, MovementSystem, PhysicsSystem } from "../modules";
import { SolVec3 } from "./SolMath";

await RAPIER.init();

export class World {
    public readonly isClient: boolean;
    private entities = new Set();
    private entityMasks: number[] = [];
    private componentPools = new Map<Function, Component[]>();
    private componentBits = new Map<Function, number>();
    private singletons = new Map<Function, any>();
    private nextBit = 0;
    private nextId = 0;
    private systems: {
        preUpdate: ISystem[],
        preStep: ISystem[],
        step: ISystem[],
        postStep: ISystem[],
        postUpdate: ISystem[]
    } = { preUpdate: [], preStep: [], step: [], postStep: [], postUpdate: [] };

    public physWorld = new RAPIER.World(SOL_PHYS.GRAVITY);
    

    constructor(isClient: boolean, clientSystems: ISystem[]) {
        this.isClient = isClient;

        const allSystems: ISystem[] = [
            new PhysicsSystem(this.physWorld),
            new MovementSystem(),
            new TestSystem(),
            ...clientSystems
        ]
        for (const s of allSystems) {
            if (s.preUpdate) this.systems.preUpdate.push(s);
            if (s.preStep) this.systems.preStep.push(s);
            if (s.step) this.systems.step.push(s);
            if (s.postStep) this.systems.postStep.push(s);
            if (s.postUpdate) this.systems.postUpdate.push(s);
        }
    }

    async start() {
        await loadMap(this.physWorld, "World0");

        // for (let i = 0; i < 5; ++i) {
        //     const id = this.spawn(EntityTypes.golem, { PhysicsComp: { pos: new SolVec3(0, i + i, 0) } });
        // }
        for (let i = 0; i < 25; ++i) {
            const id = this.spawn(EntityTypes.wizard, { PhysicsComp: { pos: new SolVec3(0, i + i+2, 0) } });
        }
        // for (let i = 0; i < 1000; ++i) {
        //     const id = this.spawn(EntityTypes.box, { PhysicsComp: { pos: new SolVec3(0, i + i, 0) } });
        //     if (i % 10) {
        //         //this.addComponent(id, new TestComp());
        //     }
        // }
    }

    spawn(type: EntityTypes, overrides?: Partial<Record<string, any>>) {
        const entityId = this.nextId++;
        const config = EntityConfig[type];
        this.entities.add(entityId);
        config.components.forEach((comp) => {
            const component = new comp.type();
            component.entityId = entityId;
            if (comp.data) Object.assign(component, comp.data);

            if (overrides && overrides[comp.type.name]) {
                Object.assign(component, overrides[comp.type.name]);
            }
            this.addComponent(entityId, component);
        })
        return entityId;
    }

    private getComponentBit(compClass: Function) {
        if (!this.componentBits.has(compClass)) {
            this.componentBits.set(compClass, 1 << this.nextBit++);
        }
        return this.componentBits.get(compClass)!;
    }

    addComponent(entityId: number, comp: Component) {
        const type = comp.constructor;
        const bit = this.getComponentBit(type);

        if (!this.componentPools.has(type)) {
            this.componentPools.set(type, []);
        }
        this.componentPools.get(type)![entityId] = comp;

        this.entityMasks[entityId] = (this.entityMasks[entityId] || 0) | bit;
    }

    query(...componentClasses: Class<Component>[]) {
        let signature = 0;
        for (const cls of componentClasses) {
            signature |= this.getComponentBit(cls);
        }
        const results: number[] = [];
        for (let i = 0; i < this.entityMasks.length; i++) {
            const mask = this.entityMasks[i];
            if (mask && (mask & signature) === signature) {
                results.push(i);
            }
        }
        return results;
    }

    get<T extends Component>(entityId: number, componentClass: Class<T>): T | undefined {
        const pool = this.componentPools.get(componentClass);
        return pool ? (pool[entityId] as T) : undefined;
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
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.preUpdate?.(this, dt, time);
            }
        }
    }

    preStep(dt: number, time: number): void {
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.preStep?.(this, dt, time);
            }
        }
    }

    step(dt: number, time: number) {
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.step?.(this, dt, time);
            }
        }
    }

    postStep(dt: number, time: number): void {
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.postStep?.(this, dt, time);
            }
        }
    }

    postUpdate(dt: number, time: number, alpha: number): void {
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.postUpdate?.(this, dt, time, alpha);
            }
        }
    }

}