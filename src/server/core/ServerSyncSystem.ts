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
    password: string | null;
}

export class ServerSyncSystem implements ISystem {
    lastSend = 0;
    private readonly SEND_RATE = 50;
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
        const world = this.worlds[data.mapIndex];
        if (!world) {
            socket.emit("join_error", { reason: "invalid_map" });
            return;
        }
        this.removeSession(socket.id);

        const userId = world.spawn({ type: EntityTypes.user });
        const user = world.get(userId, Comps.User)!;
        user.socketId = socket.id;

        const pawnId = world.spawn({
            type: EntityTypes.player,
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(0, 1, 0) } },
                { type: Comps.Owner, data: { ownerId: userId, step: world.stepCount } },
            ]
        });
        user.pawnId = pawnId;

        this.sessions.set(socket.id, { world, userId });

        socket.removeAllListeners("i");
        socket.on("i", (data) => this.clientInput(user, data));

        socket.emit("welcome", { userId, pawnId, mapIndex: data.mapIndex });

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

            for (const id of world.query([Comps.Transform])) {
                const meta = world.get(id, Comps.Meta)!;
                const xform = world.get(id, Comps.Transform)!;
                const move = world.get(id, Comps.Movement);
                const ability = world.get(id, Comps.Ability);
                const owner = world.get(id, Comps.Owner);

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

            for (const id of world.query([Comps.User])) {
                const user = world.get(id, Comps.User)!;
                snapshot.us.push([id, user.lastProcessedSeq, user.pawnId, user.inputBuffer.length]);
                this.io.to(user.socketId).emit("s", snapshot);
            }

        }
    }
}