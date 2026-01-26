import type { ISystem, Snapshot } from "#/common/core/ECS";
import { solUsers, type World } from "#/common/core/World";
import type { Server, Socket } from "socket.io";
import { NetsyncComp } from "#/common/modules/netsync/NetsyncComp";
import { MovementComp, PhysicsComp } from "#/common/modules";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { AnimationComp } from "#/client/modules/animation/AnimationComp";
import { Actions, EntityTypes } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { UserComp } from "#/common/modules/user/UserComp";

export class ServerSyncSystem implements ISystem {
    lastSend = 0;
    private readonly SEND_RATE = 50;
    constructor(private io: Server, private world: World) {
        io.on("connection", (s) => this.onClientConnect(s));
    }

    onClientConnect(socket: Socket) {
        const userId = this.world.spawn();
        solUsers.socketToUser.set(socket.id, userId);
        const pawnId = this.world.spawn(undefined, EntityTypes.wizard, {
            TransformComp: {
                pos: new SolVec3(0, 5, 0)
            }
        });

        const user = this.world.add(userId, UserComp);
        user.socketId = socket.id;
        user.entityId = userId;
        user.pawnId = pawnId;

        socket.on("i", (data) => this.clientInput(user, data));
    }

    clientInput(user: UserComp, data: any) {
        const [seq, mask, yaw, pitch] = data;
        user.inputBuffer.push({ seq, mask, yaw, pitch });
        if (user.inputBuffer.length > 50) user.inputBuffer.shift();

        const prevMask = user.inputBuffer[user.inputBuffer.length - 2]?.mask;
        const justPressed = mask & ~prevMask;


        let possessDelta = justPressed & Actions.NEXTE
            ? 1
            : justPressed & Actions.LASTE
                ? -1
                : 0;
        // Inside clientInput(user: UserComp, data: any)
        if (possessDelta) {
            const available = this.world.query(PhysicsComp);

            // We look for the index of the PAWN currently controlled, not the User Entity
            const currentPawnId = user.pawnId ?? -1;
            const currentIdx = available.indexOf(currentPawnId);

            // Calculate next index with wrap-around safety
            const nextIdx = (currentIdx + possessDelta + available.length) % available.length;
            const nextPawnId = available[nextIdx];

            // Only request a change if it's actually a different entity
            if (nextPawnId !== currentPawnId) {
                solUsers.socketToUserPending.set(user.socketId, nextPawnId);
            }
        }
        if (!user.pawnId) return;
        // Apply normal movement bits to whatever they currently control
        const move = this.world.get(user.pawnId, MovementComp);
        if (move) {
            move.actions.held |= mask;
            move.yaw = yaw;
            move.pitch = pitch;
        }

    }

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