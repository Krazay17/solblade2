import { SOL_PHYS } from "@/common/core/SolConstants";

export class SGame {
    inc = 0;
    constructor() {
    }
    run() {
        this.loop();
    }
    loop() {
        this.inc++;

        console.log(`${Math.round(Math.sin(this.inc / 100) * 100)}`);
        setTimeout(this.loop.bind(this), SOL_PHYS.TIMESTEP);
    }
}