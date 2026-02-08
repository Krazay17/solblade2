import { EntityTypes, NetworkRole, SOL_PHYS } from "#/common/core/SolConstants"
import { SolWorld } from "#/common/core/SolWorld";
import type { Server, Socket } from "socket.io";
import { ServerSyncSystem } from "./ServerSyncSystem";
import { SolVec3 } from "#/common/core/SolMath";
import { Comps, Maps } from "#/common/core/ECS";

export class SGame {
    private lastSend = 0;
    private readonly SEND_RATE = 100;
    public useHighPerformance = false;
    private targetMs = 1000 / 60;
    private nextExpectedTick = Date.now();
    tickCounter = 0;
    accumulator = 0;
    lasttime = process.hrtime.bigint();
    worlds: SolWorld[];
    netsend: ServerSyncSystem;
    constructor(io: Server) {
        const addSystems = [

        ]
        this.worlds = [
            new SolWorld(true, addSystems, Maps.world0),
            new SolWorld(true, addSystems, Maps.world1),
            new SolWorld(true, addSystems, Maps.world2),
            new SolWorld(true, addSystems, Maps.world3),
        ]

        this.netsend = new ServerSyncSystem(io, this.worlds);
    }

    run() {
        for (const w of this.worlds) w.start();
        for (const w of this.worlds) {
            for (let i = 0; i < 1; ++i) {
                const id = w.spawn({
                    type: EntityTypes.wizard,
                    components: [
                        { type: Comps.Transform, data: { pos: new SolVec3(Math.sin(i), i + i + 10, Math.cos(i)) } }
                    ]
                });
            }

        }
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
        if (this.useHighPerformance) {
            setImmediate(() => this.tick());
        } else {
            this.nextExpectedTick += this.targetMs;
            const delay = Math.max(0, this.nextExpectedTick - nowMs);
            setTimeout(() => this.tick(), delay);
        }
    }

    step(dt: number, time: number) {
        this.tickCounter++;
        for (const w of this.worlds) w.preStep(dt, time);
        for (const w of this.worlds) w.step(dt, time);
        for (const w of this.worlds) w.postStep(dt, time);
    }
    noRecoveryStep() {
        this.netsend.noRecoveryStep(this.worlds);
    }
}