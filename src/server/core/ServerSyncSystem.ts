import type { ISystem } from "#/common/core/ECS";
import { type World } from "#/common/core/World";
import type { Server, Socket } from "socket.io";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { UserComp } from "#/common/modules/controller/UserComp";
import { Comps } from "#/common/core/ECSRegi";
import type { Snapshot } from "#/common/core/SolTypes";

export class ServerSyncSystem implements ISystem {
    lastSend = 0;
    private readonly SEND_RATE = 50;
    private boundUsers = new Set();
    constructor(private io: Server, private world: World) {
        io.on("connection", (s) => this.onClientConnect(s));
        io.on("disconnect", (s) => this.onClientDisconnect(s));
    }

    onClientConnect(socket: Socket) {
        socket.on("join", (data) => {
            if (this.boundUsers.has(socket.id)) return;
            this.boundUsers.add(socket.id);
            const userId = this.world.spawn(NetworkRole.AUTHORITY, EntityTypes.user);
            const user = this.world.getComp(userId, Comps.User)!;
            user.socketId = socket.id;
            const pawnId = this.world.spawn(NetworkRole.AUTHORITY, EntityTypes.player, undefined, {
                TransformComp: {
                    pos: new SolVec3(0, 5, 0)
                }
            });
            this.world.add(pawnId, Comps.Owner).setOwnerId(userId).setStep(this.world.stepCount);
            user.pawnId = pawnId;

            socket.on("disconnect", () => this.onClientDisconnect(user));
            socket.on("i", (data) => this.clientInput(user, data));
            socket.emit("welcome", { userId, pawnId });

            console.log(`connected: 
                socket: ${socket.id} 
                userId: ${userId} 
                pawnId: ${pawnId}`);
        })
    }

    onClientDisconnect(user: UserComp) {
        if (user.pawnId)
            this.world.removeEntity(user.pawnId);
        this.world.removeEntity(user.entityId);
        console.log(`User disconnected:  ${user.entityId}`);
    }

    clientInput(user: UserComp, data: any) {
        const [seq, mask, yaw, pitch] = data;
        if (!yaw || !pitch) return;

        user.inputBuffer.push({ seq, mask, yaw, pitch });
        if (user.inputBuffer.length > 50) {
            user.inputBuffer.shift();
        }
    }

    noRecoveryStep(world: World) {
        const now = Date.now();
        if (now - this.lastSend < this.SEND_RATE) return;
        this.lastSend = now;

        const snapshot: Snapshot = {
            t: now,
            tk: world.stepCount,
            us: [],
            e: []
        };
        for (const id of world.query([Comps.User])) {
            const user = world.getComp(id, Comps.User)!;
            snapshot.us.push([id, user.lastProcessedSeq])
        }

        for (const id of world.query([Comps.Transform])) {
            const meta = world.getComp(id, Comps.Meta)!;
            const xform = world.getComp(id, Comps.Transform)!;
            const move = world.getComp(id, Comps.Movement);
            const ability = world.getComp(id, Comps.Ability);
            const owner = world.getComp(id, Comps.Owner);

            snapshot.e.push([
                id,
                meta.active,
                meta.type,
                owner?.ownerId ?? 0,
                owner?.step ?? 0,
                xform?.pos.x ?? 0,
                xform?.pos.y ?? 0,
                xform?.pos.z ?? 0,
                move?.yaw ?? 0,
                move?.state ?? null,
                ability?.state ?? null,
            ]);
        }

        this.io.emit("s", snapshot);
    }
}