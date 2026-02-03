import type { Class } from "#/types/types";
import { Comps, type ISystem, Component } from "#/common/core/ECS";
import { EntityTypes, NetworkRole, SOL_PHYS } from "./SolConstants";
import { EntityConfig } from "../config/EntityConfig";
import { loadMap } from "./PhysicsFactory";
import { AbilitySystem } from "../modules/ability/AbilitySystem";
import { StatusSystem } from "../modules/status/StatusSystem";
import { TransformSystem } from "../modules/transform/TransformSystem";
import { PossessSystem } from "#/common/modules/controller/PossessSystem";
import { InputSystem } from "../modules/controller/InputSystem";
import { CompReg, type CompInstanceMap, type ComponentDefinition } from "./ECSRegi";
import { PhysicsSystem } from "../modules/physics/PhysicsSystem";
import { MovementSystem } from "../modules/movement/MovementSystem";
import RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init();

interface ISpawnParam {
    role?: NetworkRole;
    type?: EntityTypes;
    id?: number;
    components?: ComponentDefinition[];
}

class EntityQuery {
    public entities: number[] = [];
    constructor(public signature: number) { }
}

export class World {
    public readonly isServer: boolean;
    public entities = new Set<number>();
    public stepCount = 0;
    public localId = -1;

    // Core ECS State - Refactored to use Comps enum keys
    private entityMasks: number[] = [];
    private componentPools = new Map<Comps, Component[]>();
    private componentBits = new Map<Comps, number>();
    private queries = new Map<number, EntityQuery>();

    // Singletons handle non-component system data
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
            new AbilitySystem(),
            new StatusSystem(),
            ...addSystems
        ]

        // Register system hooks
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
        while (this.entities.has(this.nextId)) this.nextId++;
        return this.nextId;
    }

    spawn({ role = NetworkRole.LOCAL, type = EntityTypes.none, components = [], id = undefined }: ISpawnParam = {} as ISpawnParam) {
        let entityId = id !== undefined ? id : this.findNewId();
        this.entities.add(entityId);

        // Add Meta strictly via Enum
        this.add(entityId, Comps.Meta, { type, active: true });

        this.setupRole(entityId, role);

        const config = EntityConfig[type];
        if (config) {
            for (const c of config.components) {
                // Check domain using Reg
                const compClass = CompReg[c.type];
                if (this.isServer && !(compClass as any).domain) continue;

                // Merge config data with spawn overrides
                const override = components.find(det => det.type === c.type);
                const data = override?.data ? { ...c.data, ...override.data } : c.data;

                this.add(entityId, c.type, data);
            }
        }

        // Add remaining components not in config
        for (const def of components) {
            if (!this.get(entityId, def.type)) {
                this.add(entityId, def.type, def.data);
            }
        }
        return entityId;
    }

    setupRole(entityId: number, role: NetworkRole) {
        let roleComp = role === NetworkRole.REMOTE
            ? NetworkRole.REMOTE
            : this.isServer ? NetworkRole.AUTHORITY : NetworkRole.LOCAL;

        switch (roleComp) {
            case NetworkRole.LOCAL:
                this.add(entityId, Comps.Local, { stepCount: this.stepCount });
                break;
            case NetworkRole.REMOTE:
                this.add(entityId, Comps.Remote, { lastSeen: performance.now() });
                break;
            case NetworkRole.AUTHORITY:
                this.add(entityId, Comps.Authority);
                break;
        }
    }

    // Refactored: Uses Comps enum key for bitmask lookup
    private getComponentBit(compType: Comps) {
        if (!this.componentBits.has(compType)) {
            this.componentBits.set(compType, 1 << this.nextBit++);
        }
        return this.componentBits.get(compType)!;
    }

    // Refactored: Only accepts Enum, instantiates via CompReg
    add<K extends Comps>(entityId: number, compType: K, data?: Partial<CompInstanceMap[K]>): CompInstanceMap[K] {
        const ClassCtor = CompReg[compType];

        // Check for existing
        let component = this.get(entityId, compType);

        if (!component) {
            component = new ClassCtor() as CompInstanceMap[K];
            component.entityId = entityId;

            // Register in pool
            if (!this.componentPools.has(compType)) {
                this.componentPools.set(compType, []);
            }
            this.componentPools.get(compType)![entityId] = component;

            // Update Mask
            const bit = this.getComponentBit(compType);
            this.entityMasks[entityId] = (this.entityMasks[entityId] || 0) | bit;

            this.updateQueries(entityId, this.entityMasks[entityId]);
        }

        // Apply data if provided
        if (data) Object.assign(component, data);

        return component;
    }

    // Refactored: Only accepts Enum
    get<K extends Comps>(entityId: number, compType: K): CompInstanceMap[K] | undefined {
        const pool = this.componentPools.get(compType);
        return pool ? (pool[entityId] as CompInstanceMap[K]) : undefined;
    }

    // Refactored: Only accepts Enum
    removeComponent(entityId: number, compType: Comps) {
        const pool = this.componentPools.get(compType);
        if (!pool || !pool[entityId]) return;

        delete pool[entityId];

        const bit = this.getComponentBit(compType);
        this.entityMasks[entityId] &= ~bit;

        this.updateQueries(entityId, this.entityMasks[entityId], true); // Force check removal
    }

    // Refactored: Iterates componentBits which is now Map<Comps, number>
    removeEntity(id: number) {
        if (!this.entities.has(id)) return;

        for (const system of this.allSystems) {
            if (system.removeEntity) system.removeEntity(this, id);
        }

        const mask = this.entityMasks[id];

        for (const [compType, bit] of this.componentBits) {
            if ((mask & bit) === bit) {
                this.removeComponent(id, compType);
            }
        }

        this.entities.delete(id);
        this.entityMasks[id] = 0;
    }

    // Refactored: Internal query update logic
    private updateQueries(entityId: number, newMask: number, checkRemoval: boolean = false) {
        for (const [signature, query] of this.queries) {
            const matches = (newMask & signature) === signature;

            if (matches) {
                if (!query.entities.includes(entityId)) {
                    query.entities.push(entityId);
                }
            } else if (checkRemoval) {
                // If it doesn't match anymore, remove it
                const index = query.entities.indexOf(entityId);
                if (index !== -1) {
                    const lastIdx = query.entities.length - 1;
                    query.entities[index] = query.entities[lastIdx];
                    query.entities.pop();
                }
            }
        }
    }

    query(comps: Comps[]): number[] {
        let signature = 0;
        for (const c of comps) {
            signature |= this.getComponentBit(c);
        }

        const cached = this.queries.get(signature);
        if (cached) return cached.entities;

        const q = new EntityQuery(signature);
        // Build initial cache
        this.entities.forEach(id => {
            const mask = this.entityMasks[id];
            if ((mask & signature) === signature) {
                q.entities.push(id);
            }
        });

        this.queries.set(signature, q);
        return q.entities;
    }

    has(id: number, comps: Comps[]) {
        if (!this.entities.has(id)) return false;
        let signature = 0;
        for (const c of comps) {
            signature |= this.getComponentBit(c);
        }
        const mask = this.entityMasks[id];
        return (mask & signature) === signature;
    }

    // --- Singleton Handling (Kept as Class/Instance for System dependencies) ---

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

    // --- System Loop ---

    preUpdate(dt: number, time: number) {
        for (const s of this.systems.preUpdate) s.preUpdate!(this, dt, time);
    }

    preStep(dt: number, time: number) {
        for (const s of this.systems.preStep) s.preStep!(this, dt, time);
    }

    step(dt: number, time: number) {
        this.stepCount++;
        for (const s of this.systems.step) s.step!(this, dt, time);
    }

    postStep(dt: number, time: number) {
        for (const s of this.systems.postStep) s.postStep!(this, dt, time);
    }

    postUpdate(dt: number, time: number, alpha: number) {
        for (const s of this.systems.postUpdate) s.postUpdate!(this, dt, time, alpha);
    }
}