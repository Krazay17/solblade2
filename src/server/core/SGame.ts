import { SOL_PHYS } from "../config/SolConstants";
import { Physics } from "./Physics";

export class SGame {
    physics: Physics;
    inc = 0;
    constructor(){
        this.physics = new Physics();
    }
    run(){
        this.loop();
    }
    loop(){
        this.inc++

        console.log(`${Math.round(Math.sin(this.inc/100)*100)}`);
        setTimeout(this.loop.bind(this), SOL_PHYS.TIMESTEP);
    }
}