import { debug } from "../debug/DebugDom";
import type { CGame } from "./CGame";

export class ClientLoop {
    runtime = 0;
    delayf = 0;
    accum = 0;
    timestep = 1 / 60;
    constructor(private main: CGame) { }
    start() {
        requestAnimationFrame(this.loop.bind(this));
    }
    loop(time: number) {
        const dt = (time - this.runtime) / 1000;
        this.runtime = time;
        if (this.main.tick) this.main.tick(dt, time);
        
        this.accum += dt;
        if (this.accum > 0.25) this.accum = 0.25;
        while (this.accum > this.timestep) {
            this.accum -= this.timestep;
            if (this.main.step) this.main.step(this.timestep, time);
        }

        if (this.delayf < this.runtime) {
            this.delayf = this.runtime + 250;
            debug.set("framerate", `Framerate: ${Math.floor(1 / dt)}`);
        }
        requestAnimationFrame(this.loop.bind(this));
    }
}