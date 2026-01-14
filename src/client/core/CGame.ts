import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { PlayerController } from "../input/PlayerController";
import { World } from "@/common/core/World";
import { ActorFactory } from "@/common/core/ActorFactory";

export class CGame {
    loop: ClientLoop;
    rendering?: Rendering;
    world?: World;
    controller?: PlayerController;
    actorFactory?: ActorFactory;
    constructor(canvas: HTMLElement) {
        this.loop = new ClientLoop(this);
        this.controller = new PlayerController();

        if (canvas) {
            this.rendering = new Rendering(canvas);
            this.world = new World(this.rendering);
        }
    }
    async run() {
        this.world?.loadMap("World1");
        this.world?.createActor("cube");
        this.loop.start();
    }
    tick(dt: number, time: number) {
        this.world?.tick(dt, time);

        this.rendering?.render(dt);
    }
    step(dt: number, time: number) {
        this.world?.step(dt, time);
    }
}