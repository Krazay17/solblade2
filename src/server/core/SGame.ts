import { SOL_PHYS } from "#/common/core/SolConstants"
import { World } from "#/common/core/World";
import { MovementComp, PhysicsComp } from "#/common/modules";
import type { Server } from "socket.io";

export class SGame {
    private lastSend = 0;
    private readonly SEND_RATE = 50;
    tickCounter = 0;
    accumulator = 0;
    lasttime = process.hrtime.bigint();
    world = new World(false);

    constructor(private io: Server) { }

    async run() {
        await this.world.start();
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
            this.broadcastState();
        }

        setImmediate(() => this.tick());
    }

    step(dt: number, time: number) {
        this.tickCounter++;
        this.world.preStep(dt, time);
        this.world.step(dt, time);
        this.world.postStep(dt, time);
    }

    broadcastState() {
        const now = performance.now();
        if (now - this.lastSend < this.SEND_RATE) return;
        this.lastSend = now;
        const snapshot: any = {
            t: Date.now(), // Timestamp for interpolation
            e: []          // Entities
        };
        for (const id of this.world.query(PhysicsComp, MovementComp)) {
            const phys = this.world.get(id, PhysicsComp)!;
            const move = this.world.get(id, MovementComp)!;
            snapshot.e.push([
                id,
                phys.pos.x,
                phys.pos.y,
                phys.pos.z,
                move.yaw,
                move.state // e.g., "jump", "walk"
            ]);
        }
        this.io.emit("s", snapshot);
    }
}