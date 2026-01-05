import { Physics } from "@/server/core/Physics";
import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { CWorld } from "./CWorld";

export class CGame {
    loop: ClientLoop;
    //canvas = document.createElement("canvas").id = "game";
    physics: Physics;
    rendering?: Rendering;
    world?: CWorld;
    constructor() {
        this.loop = new ClientLoop(this);
        this.physics = new Physics();
        const canvas = document.getElementById("game");

        if (canvas) {
            this.rendering = new Rendering(canvas);
            this.world = new CWorld(this.rendering?.scene);
        }
    }
    async run() {
        this.loop.start();
    }
    tick(dt: number, time: number) {
        this.world?.tick(dt, time);

        this.rendering?.render(dt);
    }
    step(dt: number, time: number) {
        this.physics.world.step();
    }
}