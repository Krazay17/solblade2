import { Physics } from "./Physics";
import { Actor, ControllerType, type ActorInit, type xForm } from "./Actor";
import type { System } from "../systems/System";
import { MovementSystem } from "../systems/movement/MovementSystem";
import { ActorTypes } from "../config/ActorConfig";
import { COMPTYPE } from "../systems";

export class World {
    public readonly isClient: boolean;
    physics = new Physics();
    actors: Map<string, Actor> = new Map();
    systems: System<any>[] = [
        new MovementSystem(),
    ];
    constructor(isClient: boolean) {
        this.isClient = isClient;
    }
    async loadMap(name: string) {
        this.physics.loadMap(name);
    }
    async spawn(init: ActorInit, xForm: xForm, controller: ControllerType) {
        const actor = new Actor(init);
        const config = ActorTypes[actor.type];
        actor.model = config.model;
        actor.modelOffset = config.modelOffset ?? 0;
        actor.body = this.physics.createBody(config.body, controller).body;
        actor.body.setTranslation(xForm.pos, true);
        if (config.comps)
            for (const compName of config.comps) {
                actor.add(compName, new COMPTYPE[compName]);
            }
        for (const system of this.systems) {
            system.register(actor);
        }

        this.actors.set(actor.id, actor);
        return actor;
    }
    tick(dt: number, time: number) { }
    step(dt: number, time: number) {
        for (const system of this.systems) system.update(dt, time);
        this.physics.step(dt, time);
    }
}