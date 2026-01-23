import { SOL_PHYS } from "#/common/core/SolConstants"

export class SGame {
    inc = 0;
    accumulator = 0;
    lasttime = process.hrtime.bigint();
    constructor() {
    }
    run() {
        this.tick();
    }
    tick() {
        const now = process.hrtime.bigint();
        let dt = Number(now - this.lasttime) / 1_000_000
        this.lasttime = now;

        if (dt > 0.25) dt = 0.25;

        this.accumulator += dt;
        while (this.accumulator >= SOL_PHYS.TIMESTEP) {
            this.step(SOL_PHYS.TIMESTEP, Number(now));
            this.accumulator -= SOL_PHYS.TIMESTEP
        }

        setImmediate(() => this.tick());
    }
    step(dt: number, time: number) {
        this.inc++;
        //console.log(`${Math.round(Math.sin(this.inc / 100) * 100)}`);
        //console.log(dt)

    }
}