import { debug } from "../debug/DebugDom";
import type { CGame } from "./CGame";

export class ClientLoop {
    runtime = 0;
    delayf = 0;
    accum = 0;
    timestep = 1 / 60;
    private active = true;
    private focus = true;
    constructor(private game: CGame) {
        window.addEventListener("focusin", (e) => {
            this.focus = true
            if (!this.active) this.start();
        });
        window.addEventListener("focusout", (e) => this.focus = false);
    }
    start() {
        this.active = true;
        requestAnimationFrame(this.loop);
    }
    stop() {
        this.active = false;
    }
    tabOut() {
        if (this.focus = false)
            this.active = false;
    }
    loop = (time: number) => {
        const dt = (time - this.runtime) / 1000;
        this.runtime = time;
        if (dt > 1) this.tabOut();
        if (!this.active) return;
        
        if (this.game.preUpdate) this.game.preUpdate(dt, time);

        this.accum += dt;
        if (this.accum > 0.25) this.accum = 0.25;
        while (this.accum > this.timestep) {
            this.accum -= this.timestep;
            if (this.game.step) this.game.step(this.timestep, time);
        }

        if(this.game.postUpdate)this.game.postUpdate(dt, time);

        if (this.delayf < this.runtime) {
            this.delayf = this.runtime + 250;
            debug.set("framerate", `Framerate: ${Math.floor(1 / dt)}`);
        }

        requestAnimationFrame(this.loop);
    }
}