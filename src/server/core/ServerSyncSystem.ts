import type { ISystem } from "#/common/core/ECS";
import { type World } from "#/common/core/World";
import type { Server, Socket } from "socket.io";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { UserComp } from "#/common/modules/user/UserComp";
import { MetadataComp } from "#/common/modules/meta/MetadataComp";
import { AbilityComp } from "#/common/modules/ability/AbilityComp";
import { OwnerComp } from "#/common/modules/user/OwnerComp";
import { Comps } from "#/common/core/ECSRegi";

export enum SnapshotIndices {
    ID = 0,
    IS_ACTIVE = 1,
    TYPE = 2,
    OWNERID = 3,
    OWNERSTEP = 4,
    POS_X = 5,
    POS_Y = 6,
    POS_Z = 7,
    YAW = 8,
    MOVESTATE = 9,
    ABILITYSTATE = 10,
}

// Create a strict Tuple type
export type EntityState = [
    id: number,
    active: boolean,
    type: number,
    ownerId: number,
    ownerStep: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
    moveState: string | null,
    abilityState: string | null
];

export interface Snapshot {
    t: number;  // timestamp
    tk: number; // tick count
    ct: number;
    e: EntityState[];
}

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

        // 1. Basic validation (prevent teleports/cheats)
        // You could check if yaw/pitch are NaN or out of bounds here

        // 2. Push to the buffer
        user.inputBuffer.push({ seq, mask, yaw, pitch });

        // 3. Keep buffer size sane (prevent memory leaks from laggy clients)
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
            ct: 0,
            e: []
        };

        for (const id of world.query([Comps.Authority])) {
            const meta = world.get(id, MetadataComp)!;
            const xform = world.get(id, TransformComp);
            const move = world.getComp(id, Comps.Movement);
            const ability = world.get(id, AbilityComp);
            const owner = world.get(id, OwnerComp);
            const user = world.getComp(id, Comps.User);

            if (user) snapshot.ct = user.lastProcessedSeq;

            // Directly push the most recent data from the source components
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