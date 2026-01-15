import { Physics } from "./Physics";
import { Actor, ControllerType, type ActorInit } from "../actor/Actor";
import type { System } from "../systems/System";
import { MovementSystem } from "../systems/movement/MovementSystem";
import { ActorTypes } from "../config/ActorConfig";

export class World {
    public readonly isClient: boolean;
    physics = new Physics();
    actors: Map<string, Actor> = new Map();
    systems: System[] = [new MovementSystem()];
    constructor(isClient: boolean) {
        this.isClient = isClient;
    }
    async loadMap(name: string) {
        this.physics.loadMap(name);
    }
    async spawn(init: ActorInit, controller: ControllerType) {
        const actor = new Actor(init);
        const config = ActorTypes[actor.type];
        actor.body = this.physics.createBody(config.body, controller).body;
        actor.body.setTranslation({x:actor.pos[0], y: actor.pos[1], z: actor.pos[2]}, true);
        
        this.actors.set(actor.id, actor);
        return actor;
    }
    tick(dt: number, time: number) { }
    step(dt: number, time: number) {

        this.physics.step(dt, time);
    }
}