import type { ISystem, Snapshot } from "#/common/core/ECS";
import { type World } from "#/common/core/World";
import type { Server, Socket } from "socket.io";
import { MovementComp } from "#/common/modules";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { AnimationComp } from "#/client/modules/animation/AnimationComp";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { UserComp } from "#/common/modules/user/UserComp";
import { MetadataComp } from "#/common/modules/meta/MetadataComp";
import { AuthorityComp } from "#/common/modules/network/AuthorityComp";

export class ServerSyncSystem implements ISystem {
    lastSend = 0;
    private readonly SEND_RATE = 50;
    constructor(private io: Server, private world: World) {
        io.on("connection", (s) => this.onClientConnect(s));
        io.on("disconnect", (s) => this.onClientDisconnect(s));
    }

    onClientConnect(socket: Socket) {
        const userId = this.world.spawn(NetworkRole.AUTHORITY);
        const user = this.world.add(userId, UserComp);
        user.socketId = socket.id;
        const pawnId = this.world.spawn(NetworkRole.AUTHORITY, EntityTypes.player, undefined, {
            TransformComp: {
                pos: new SolVec3(0, 5, 0)
            }
        });
        user.pawnId = pawnId;

        socket.on("disconnect", () => this.onClientDisconnect(user));
        socket.on("i", (data) => this.clientInput(user, data));
        socket.emit("welcome", { userId, pawnId });

        console.log(`connected: 
            socket: ${socket.id} 
            userId: ${userId} 
            pawnId: ${pawnId}`);
    }

    onClientDisconnect(user: UserComp) {
        if (user.pawnId)
            this.world.removeEntity(user.pawnId);
        this.world.removeEntity(user.entityId);
        console.log(`User disconnected:  ${user.entityId}`);
    }

    // Inside ServerSyncSystem
    clientInput(user: UserComp, data: any) {
        const [seq, mask, yaw, pitch] = data;

        // 1. Basic validation (prevent teleports/cheats)
        // You could check if yaw/pitch are NaN or out of bounds here

        // 2. Push to the buffer
        user.inputBuffer.push({ seq, mask, yaw, pitch });

        // 3. Keep buffer size sane (prevent memory leaks from laggy clients)
        // if (user.inputBuffer.length > 20) {
        //     user.inputBuffer.shift();
        // }
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

        for (const id of world.query(AuthorityComp)) {
            const meta = world.get(id, MetadataComp)!;
            const xform = world.get(id, TransformComp);
            const move = world.get(id, MovementComp);
            const anim = world.get(id, AnimationComp);

            // Directly push the most recent data from the source components
            snapshot.e.push([
                id,
                meta.active,
                meta.type,
                xform?.pos.x ?? 0,
                xform?.pos.y ?? 0,
                xform?.pos.z ?? 0,
                move?.yaw ?? 0,
                anim?.current ?? 0,
            ]);
        }

        this.io.emit("s", snapshot);
    }
}