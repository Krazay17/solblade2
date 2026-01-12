import type { Rendering } from "@/client/core/Rendering";
import { Physics } from "./Physics";
import { ActorFactory } from "./ActorFactory";
import { Actor } from "../actor/Actor";

export class World {
    physics = new Physics();
    actors: Actor[] = [];
    actorFactory: ActorFactory;
    constructor(private rendering: Rendering) {
        this.actorFactory = new ActorFactory(this.physics, rendering);
    }
    async loadMap(name: string) {
        this.physics.loadMap(name);
        this.rendering?.loadMap(name);
    }
    async createPlayer() {
        this.actors.push(await this.actorFactory.createActor("player"));
    }
    async createActor(type: string) {
        this.actors.push(await this.actorFactory.createActor(type))
    }
    tick(dt: number, time: number) { }
    step(dt: number, time: number) { }
}