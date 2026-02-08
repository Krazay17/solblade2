import { Comps, Maps, type ISystem } from "#/common/core/ECS";
import { SolWorld } from "#/common/core/SolWorld";
import type { Server, Socket } from "socket.io";
import { EntityTypes } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { UserComp } from "#/common/modules/controller/UserComp";
import type { Snapshot } from "#/common/core/SolTypes";


export interface IJoinData {
    mapIndex: Maps;
    name: string;
    uid: string;
}

export class ServerSyncSystem implements ISystem {
    lastSend = 0;
    private readonly SEND_RATE = 16.67;
    private sessions = new Map<string, { world: SolWorld, userId: number }>();

    constructor(private io: Server, private worlds: SolWorld[]) {
        io.on("connection", (s) => this.onClientConnect(s));
    }

    onClientConnect(socket: Socket) {
        socket.on("join", (data: IJoinData) => {
            this.handleJoin(socket, data);
        })
        socket.on("disconnect", () => {
            this.removeSession(socket.id);
        })
    }

    handleJoin(socket: Socket, data: IJoinData) {
        console.log(data);
        const { uid, mapIndex, name } = data;
        const world = this.worlds[mapIndex];
        if (!world) {
            socket.emit("join_error", { reason: "invalid_map" });
            return;
        }
        this.removeSession(socket.id);

        // Reuse existing user entity if it's a reconnection
        let userId = world.uidToEntity.get(uid);

        if (!userId) {
            userId = world.spawn({
                uid, // Identity goes here
                components: [{ type: Comps.User, data: { socketId: socket.id } }]
            });
        }

        // Pawn refers to the User entity ID, not the UID string
        const pawnId = world.spawn({
            type: EntityTypes.player,
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(0, 1, 0) } },
                { type: Comps.Owner, data: { ownerId: userId } } // Logic refers to ID
            ]
        });

        const user = world.get(userId, Comps.User)!;
        user.pawnId = pawnId;

        this.sessions.set(socket.id, { world, userId });

        socket.removeAllListeners("i");
        socket.on("i", (data) => this.clientInput(user, data));

        socket.emit("welcome", { userId, pawnId, mapIndex });

        console.log(`[join]
                socket: ${socket.id} 
                userId: ${userId} 
                pawnId: ${pawnId}`);
    }

    removeSession(socketId: string) {
        const session = this.sessions.get(socketId);
        if (!session) return;

        const { world, userId } = session;
        const user = world.get(userId, Comps.User);
        if (user?.pawnId) world.removeEntity(user.pawnId);
        world.removeEntity(userId);

        this.sessions.delete(socketId);
        console.log(`[leave] sockeet=${socketId} userId=${userId}`)
    }

    clientInput(user: UserComp, data: any) {
        const [seq, mask, yaw, pitch] = data;
        if (yaw === undefined || pitch === undefined) return;

        user.inputBuffer.push({ seq, mask, yaw, pitch });
    }

    noRecoveryStep(worlds: SolWorld[]) {
        const now = performance.now();
        if (now - this.lastSend < this.SEND_RATE) return;
        this.lastSend = now;
        for (const world of worlds) {
            const snapshot: Snapshot = {
                t: now,
                tk: world.stepCount,
                us: [],
                e: []
            };

            for (const eid of world.query([Comps.Authority])) {
                const auth = world.get(eid, Comps.Authority)!;
                const meta = world.get(eid, Comps.Meta)!;
                const xform = world.get(eid, Comps.Transform);
                const move = world.get(eid, Comps.Movement);
                const ability = world.get(eid, Comps.Ability);
                const owner = world.get(eid, Comps.Owner);

                snapshot.e.push([
                    eid,
                    meta.active,
                    meta.type,
                    owner?.ownerId ?? 0,
                    owner?.iid ?? 0,
                    xform?.pos.x ?? 0,
                    xform?.pos.y ?? 0,
                    xform?.pos.z ?? 0,
                    move?.yaw ?? 0,
                    move?.state ?? null,
                    ability?.state ?? null,
                ]);
            }

            for (const id of world.query([Comps.User])) {
                const user = world.get(id, Comps.User)!;
                snapshot.us.push([id, user.lastProcessedSeq, user.pawnId, user.inputBuffer.length]);
                this.io.to(user.socketId).emit("s", snapshot);
            }

        }
    }
}