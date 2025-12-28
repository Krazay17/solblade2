import { Physics } from "@/server/core/Physics";
import { ClientLoop } from "./ClientLoop";
import { debug } from "../debug/DebugDom";

export class CMain {
    physics: Physics;
    loop: ClientLoop;
    constructor() {
        this.loop = new ClientLoop(this);
        this.physics = new Physics();
    }
    async run() {
        this.loop.start();
    }
    tick(dt, time) {
        debug.set("test", `testing: ${time}`);
    }
    step(dt, time) {

    }
}

const game = new CMain();
game.run();