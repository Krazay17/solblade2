import { ControllerType, EntityTypes, SOL_PHYS } from "#/common/core/SolConstants"
import { World } from "#/common/core/World";
import type { Server } from "socket.io";
import { ServerSyncSystem } from "./ServerSyncSystem";
import { SolVec3 } from "#/common/core/SolMath";

export class SGame {
    private lastSend = 0;
    private readonly SEND_RATE = 50;
    tickCounter = 0;
    accumulator = 0;
    lasttime = process.hrtime.bigint();
    world: World;
    netsend: ServerSyncSystem;
    constructor(private io: Server) {
        this.netsend = new ServerSyncSystem(io);
        const addSystems = [

        ]

        this.world = new World(true, addSystems);
    }

    async run() {
        await this.world.start();
        for (let i = 0; i < 10; ++i) {
            const id = this.world.spawn(EntityTypes.wizard, {
                PhysicsComp: {
                    pos: new SolVec3(Math.sin(i), i + i * 2 + 10, Math.cos(i)), velocity: { y: 1 }
                }
            });

        }
        this.tick();
    }

    tick() {
        const now = process.hrtime.bigint();
        let dt = Number(now - this.lasttime) / 1_000_000
        this.lasttime = now;

        if (dt > 0.25) dt = 0.25;

        this.accumulator += dt;
        let didStep = false;
        while (this.accumulator >= SOL_PHYS.TIMESTEP) {
            this.step(SOL_PHYS.TIMESTEP, Number(now));
            this.accumulator -= SOL_PHYS.TIMESTEP
            didStep = true;
        }
        if (didStep) {
            this.noRecoveryStep();
        }

        setImmediate(() => this.tick());
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