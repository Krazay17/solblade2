import type { ISystem } from "../systems/System";
import { MovementSystem } from "../systems/movement/MovementSystem";
import { PhysicsSystem } from "../systems/physics/PhysicsSystem";
import type { Component } from "../systems/Component";
import { EntityTypes, SOL_PHYS } from "./SolConstants";
import { EntityConfig } from "../config/EntityConfig";
import RAPIER from "@dimforge/rapier3d-compat";
import { TransformSystem } from "../systems/transform/TransformSystem";
import { loadMap } from "./PhysicsFactory";
import type { Class } from "@/types/types";
import { TestSystem } from "../systems/test/TestSystem";
import { TestComp } from "../systems";
import { SolVec3 } from "./SolMath";

await RAPIER.init();

export class World {
    public readonly isClient: boolean;
    private entities = new Set();
    private entityMasks: number[] = [];
    private componentPools = new Map<Function, Component[]>();
    private componentBits = new Map<Function, number>();
    private singletons = new Map<Function, Component>();
    private nextBit = 0;
    private nextId = 0;
    public physWorld = new RAPIER.World(SOL_PHYS.GRAVITY);
    private systems: {
        input: ISystem[],
        logic: ISystem[],
        physics: ISystem[],
        render: ISystem[]
    } = { input: [], logic: [], physics: [], render: [] };

    private tempVec = new SolVec3();

    constructor(isClient: boolean, clientSystems: ISystem) {
        this.isClient = isClient;

        this.systems.input.push();
        this.systems.logic.push(new MovementSystem());
        this.systems.physics.push(
            new TestSystem(),
            new PhysicsSystem(this.physWorld),
            new TransformSystem(),
        );
        this.systems.render.push(clientSystems);
    }

    async start() {
        await loadMap(this.physWorld, "World0");

        for (let i = 0; i < 1000; ++i) {
            const id = this.spawn(EntityTypes.box, { PhysicsComp: { pos: new SolVec3(0, i + i, 0) } });
            // if (i % 2) {
            //     this.addComponent(id, new TestComp());
            // }
        }
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
            //this.registerWithSystem(component);
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

    getSingleton<T extends Component>(cls: Class<T>): T {
        let instance = this.singletons.get(cls) as T;
        if (!instance) {
            instance = new cls();
            this.singletons.set(cls, instance);
        }
        return instance;
    }

    // registerWithSystem(comp: Component) {
    //     const allSystems = Object.values(this.systems).flat();
    //     for (const s of allSystems) s.addComp(comp);
    // }

    step(dt: number, time: number) {
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.update(this, dt, time);
            }
        }
    }

}