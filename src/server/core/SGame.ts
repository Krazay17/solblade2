import { ControllerType, EntityTypes, SOL_PHYS } from "#/common/core/SolConstants"
import { World } from "#/common/core/World";
import type { Server, Socket } from "socket.io";
import { ServerSyncSystem } from "./ServerSyncSystem";
import { SolVec3 } from "#/common/core/SolMath";

export class SGame {
    private lastSend = 0;
    private readonly SEND_RATE = 50;
    public useHighPerformance = false;
    private targetMs = 1000/60;
    private nextExpectedTick = Date.now();
    tickCounter = 0;
    accumulator = 0;
    lasttime = process.hrtime.bigint();
    world: World;
    netsend: ServerSyncSystem;
    constructor(io: Server) {
        const addSystems = [

        ]
        this.world = new World(true, addSystems);

        this.netsend = new ServerSyncSystem(io, this.world);
    }

    async run() {
        await this.world.start();
        // for (let i = 0; i < 6; ++i) {
        //     const id = this.world.spawn(undefined, EntityTypes.wizard, {
        //         TransformComp: {
        //             pos: new SolVec3(Math.sin(i), i + i * 2 + 10, Math.cos(i))
        //         }
        //     });
        // }
        this.nextExpectedTick = Date.now();
        this.tick();
    }

    tick() {
        const now = process.hrtime.bigint();
        const nowMs = Date.now();
        let dt = Number(now - this.lasttime) / 1_000_000_000;
        this.lasttime = now;

        if (dt > 0.25) dt = 0.25;

        this.accumulator += dt;
        let didStep = false;
        while (this.accumulator >= SOL_PHYS.TIMESTEP) {
            this.step(SOL_PHYS.TIMESTEP, Number(now) / 1_000_000);
            this.accumulator -= SOL_PHYS.TIMESTEP
            didStep = true;
        }
        if (didStep) {
            this.noRecoveryStep();
        }
        if(this.useHighPerformance){
            setImmediate(() => this.tick());
        } else {
            this.nextExpectedTick += this.targetMs;
            const delay = Math.max(0, this.nextExpectedTick - nowMs);
            setTimeout(()=>this.tick(), delay);
        }
    }

    step(dt: number, time: number) {
        this.tickCounter++;
        this.world.preStep(dt, time);
        this.world.step(dt, time);
        this.world.postStep(dt, time);
    }
    noRecoveryStep() {
        this.netsend.noRecoveryStep(this.world);
    }
}