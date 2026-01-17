import type { ISystem } from "../systems/System";
import { MovementSystem } from "../systems/movement/MovementSystem";
import { InputSystem } from "../systems/input/InputSystem";
import { PhysicsSystem } from "../systems/physics/PhysicsSystem";
import type { Component } from "../systems/Component";
import { SOL_PHYS, type EntityTypes } from "./SolConstants";
import { EntityConfig } from "../config/EntityConfig";
import RAPIER from "@dimforge/rapier3d-compat";
import { TransformSystem } from "../systems/transform/TransformSystem";
import { loadMap } from "./PhysicsFactory";

await RAPIER.init();

export class World {
    public readonly isClient: boolean;
    private entities = new Set();
    private componentMap = new Map<number, Map<any, Component>>();
    private nextId = 0;
    public physWorld = new RAPIER.World(SOL_PHYS.GRAVITY);
    private systems: {
        input: ISystem[],
        logic: ISystem[],
        physics: ISystem[],
        render: ISystem[]
    } = { input: [], logic: [], physics: [], render: [] };
    constructor(isClient: boolean, clientSystems: ISystem) {
        this.isClient = isClient;

        this.systems.input.push(new InputSystem());
        this.systems.logic.push(new MovementSystem());
        this.systems.physics.push(
            new PhysicsSystem(this.physWorld),
            new TransformSystem(),
        );
        this.systems.render.push(clientSystems);
    }
    async start() {
        await loadMap(this.physWorld, "World0");
    }
    spawn(type: EntityTypes, overrides?: Partial<Record<string, any>>) {
        const entityId = this.nextId++;
        const config = EntityConfig[type];
        this.entities.add(entityId);
        this.componentMap.set(entityId, new Map());
        config.components.forEach((comp) => {
            const component = new comp.type();
            component.entityId = entityId;
            if (comp.data) Object.assign(component, comp.data);

            if (overrides && overrides[comp.type.name]) {
                Object.assign(component, overrides[comp.type.name]);
            }
            this.registerWithSystem(component);
            this.componentMap.get(entityId)!.set(comp.type, component);
        })
        return entityId;
    }
    getComponent<T extends Component>(entityId: number, componentClass: new (...args: any[]) => T): T | undefined {
        return this.componentMap.get(entityId)?.get(componentClass) as T;
    }
    registerWithSystem(comp: Component) {
        const allSystems = Object.values(this.systems).flat();
        for (const s of allSystems) s.addComp(comp);
    }
    step(dt: number, time: number) {
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.update(this, dt);
            }
        }
    }
}