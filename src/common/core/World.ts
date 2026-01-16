import type { ISystem } from "../systems/System";
import { MovementSystem } from "../systems/movement/MovementSystem";
import { InputSystem } from "../systems/input/InputSystem";
import { PhysicsSystem } from "../systems/physics/PhysicsSystem";
import type { Component } from "../systems/Component";
import type { EntityTypes } from "./SolConstants";
import { EntityConfig } from "../config/EntityConfig";
import RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init();

export class World {
    public readonly isClient: boolean;
    private entities = new Set();
    private componentMap = new Map<number, Map<any, Component>>();
    private nextId = 0;
    private systems: {
        input: ISystem[],
        logic: ISystem[],
        physics: ISystem[]
    } = { input: [], logic: [], physics: [] };
    constructor(isClient: boolean) {
        this.isClient = isClient;

        this.systems.input.push(new InputSystem());
        this.systems.logic.push(new MovementSystem());
        this.systems.physics.push(new PhysicsSystem());
    }
    async spawn(type: EntityTypes) {
        const entityId = this.nextId++;
        const config = EntityConfig[type];
        this.entities.add(entityId);
        this.componentMap.set(entityId, new Map());
        config.components.forEach((comp) => {
            const component = new comp.type();
            component.entityId = entityId;
            if (comp.data) Object.assign(component, comp.data);
            this.registerWithSystem(component);
            this.componentMap.get(entityId)!.set(comp.type, component);
        })
    }
    getComponent<T extends Component>(entityId: number, componentClass: new (...args: any[]) => T): T | undefined {
        return this.componentMap.get(entityId)?.get(componentClass) as T;
    }
    registerWithSystem(comp: Component) {
        const allSystems = Object.values(this.systems).flat();
        for (const s of allSystems) s.addComp(comp);
    }
    tick(dt: number, time: number) { }
    step(dt: number, time: number) {
        for (const phase of Object.values(this.systems)) {
            for (const system of phase) {
                system.update(this, dt);
            }
        }
    }
}