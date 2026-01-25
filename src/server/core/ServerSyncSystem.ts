import type { ISystem, Snapshot } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import type { Server } from "socket.io";
import { NetsyncComp } from "#/common/modules/netsync/NetsyncComp";
import { MovementComp } from "#/common/modules";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { AnimationComp } from "#/client/modules/animation/AnimationComp";

export class ServerSyncSystem implements ISystem {
    lastSend = 0;
    private readonly SEND_RATE = 50;
    constructor(private io: Server) { }
    noRecoveryStep(world: World) {
        const now = Date.now();
        if (now - this.lastSend < this.SEND_RATE) return;
        this.lastSend = now;

        const snapshot: Snapshot = {
            t: now,
            tk: world.stepCount,
            e: []
        };

        for (const id of world.query(NetsyncComp)) {
            const net = world.get(id, NetsyncComp)!;
            const xform = world.get(id, TransformComp);
            const move = world.get(id, MovementComp);
            const anim = world.get(id, AnimationComp);

            // Directly push the most recent data from the source components
            snapshot.e.push([
                id,
                net.active,
                net.type, // e.g., EntityTypes.WIZARD
                xform?.pos.x ?? 0,
                xform?.pos.y ?? 0,
                xform?.pos.z ?? 0,
                move?.yaw ?? 0,
                anim?.currentAnim ?? 0,
            ]);
        }

        this.io.emit("s", snapshot);
    }
}