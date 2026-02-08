import type { CNet } from "#/client/core/CNet";
import { Comps, type ISystem } from "#/common/core/ECS";
import { type SolWorld } from "#/common/core/SolWorld";
import { lerp } from "three/src/math/MathUtils.js";
import { LocalInput } from "#/client/core/LocalInput";
import { SolVec3 } from "#/common/core/SolMath";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { SnapshotIndices, type EntityState, type Snapshot } from "#/common/core/SolTypes";
import type { ClientLoop } from "#/client/core/ClientLoop";
import RAPIER from "@dimforge/rapier3d-compat";
import type { UserComp } from "#/common/modules/controller/UserComp";
import { bodyPhysChange } from "#/common/core/PhysicsFactory";
import { type IJoinData } from "#/server/core/ServerSyncSystem";
import solSave from "#/client/core/SolSave";

export class ClientSyncSystem implements ISystem {
    private snapshotBuffer: Snapshot[] = [];
    private _snap0Map = new Map<number, EntityState>();
    private bound = false;
    public isSynced = false;
    private clientTickTime = new Map<number, number>();
    public ping: number = 0;
    private s0: Snapshot | null = null;
    private s1: Snapshot | null = null;
    private lastRecieved = 0;

    private serverToLocal = new Map<number, number>();
    private uidToLocal = new Map<string, number>();
    private myUID: string;

    private _world: SolWorld | null = null;
    get world() { return this._world!; }
    set world(w: SolWorld) { this._world = w; }

    constructor(private io: CNet, private clientLoop: ClientLoop) {
        this.myUID = solSave.uid;
    }

    join() {
        if (!this.bound) {
            this.bound = true;
            this.io.socket.on("connect", () => this.sendJoinData());
            this.io.on("s", (s: Snapshot) => this.onSnapshot(s));

            this.io.on("welcome", (data: any) => this.handleWelcome(data));
        }
        this.sendJoinData();
    }

    handleWelcome(data: { userId: number, pawnId: number }) {
        const world = this.world;
        const myLocalUserId = world.localId;
        const user = world.get(myLocalUserId, Comps.User)!;

        // Link the persistent local user to the server's session ID
        this.bindIds(data.userId, myLocalUserId, this.myUID);

        let localPawnId = user.pawnId;
        if (localPawnId && world.entities.has(localPawnId)) {
            const owner = world.get(localPawnId, Comps.Owner);
            if (owner) this.bindIds(data.pawnId, localPawnId, owner.uid);
        }

        this.isSynced = true;
    }

    private bindIds(serverId: number, localId: number, uid: string) {
        this.serverToLocal.set(serverId, localId);
        this.uidToLocal.set(uid, localId);
        // Add a Remote component to mark it as networked without destroying local state
        this.world.add(localId, Comps.Remote, { serverId });
    }

    desync() {
        this.isSynced = false;
        this.s0 = null;
        this.s1 = null;
        this.clientTickTime.clear();
    }

    sendJoinData(world: SolWorld = this.world) {
        const joinData: IJoinData = {
            name: solSave.name,
            mapIndex: world.mapIndex,
            uid: solSave.uid
        }
        this.io.emit("join", joinData);
    }

    onSnapshot(snaphshot: Snapshot) {
        if (!this.isSynced) return;
        this.s0 = this.s1;
        this.s1 = snaphshot;
        this.lastRecieved = performance.now();
    }

    preStep(world: SolWorld) {
        if (!this.isSynced) return;
        this.sendInputs(world);
        const snaps = this.getInterpolationSnaps(world);
        if (!snaps) return;
        const { s0, s1, alpha } = snaps;
        if (!s1) return;
        const localUser = world.get(world.localId, Comps.User);
        if (!localUser) return
        const localUserNet = s1.us.find(u => u[0] === localUser.entityId);
        this._snap0Map.clear();
        for (const e of s0.e) this._snap0Map.set(e[0], e);
        this.syncUsers(world, s1, localUser, localUserNet);
        this.syncActors(world, s1, localUser, alpha);
    }

    syncUsers(world: SolWorld, s1: Snapshot, localUser: UserComp, localUserNet: any) {
        if (!localUserNet) return;
        const sentTime = this.clientTickTime.get(localUserNet[1]);
        if (sentTime) {
            const rtt = performance.now() - sentTime;
            this.ping = Math.round((this.ping * 0.9) + (rtt * 0.1));
        }
        const pawnId = localUserNet[2];
        if (pawnId && pawnId !== localUser.pawnId)
            this.switchPawn(world, localUser, pawnId);
    }

    syncActors(world: SolWorld, s1: Snapshot, localUser: UserComp, alpha: number) {
        const now = performance.now();
        const localIds = world.query([Comps.Local]);
        for (const entityData of s1.e) {
            const [eid, active, type, ownerId, iid, x, y, z, yaw, moveState, abilityState] = entityData;
            const localId = this.serverToLocal.get(eid);
            if (localId === localUser.entityId) {
                continue;
            }
            if (!active) {
                world.removeEntity(eid);
                continue;
            }
            if (eid === localUser.pawnId) {
                this.reconcilePlayer(world, eid, x, y, z, entityData);
                continue;
            }

            console.log(world.existingEntities.get(eid))


            if (ownerId === localUser.entityId) {
                const predicted = world.query([Comps.Owner, Comps.Local])
                    .find(eid => {
                        if (eid === localUser.pawnId) return false;
                        const o = world.get(eid, Comps.Owner)!;
                        return o.ownerId === ownerId && o.step === ownerStep;
                    });

                if (predicted) {
                    world.removeEntity(predicted);
                }
            }

            if (!world.entities.has(id)) {
                this.handleSpawn(world, entityData, NetworkRole.REMOTE);
                continue;
            }
            const remote = world.get(id, Comps.Remote);
            if (remote) remote.lastSeen = now;
            if (ownerId) world.add(id, Comps.Owner, { ownerId })

            this.handleTransform(world, id, entityData, alpha);

            const move = world.get(id, Comps.Movement);
            const ability = world.get(id, Comps.Ability);
            if (move) {
                move.yaw = yaw;
                move.state = moveState ?? move.state;
            }
            if (ability) {
                ability.requestedState = abilityState ?? null;
            }
        }
    }

    reconcileLocal(world: SolWorld, id: number, entityData: EntityState) {
        const xform = world.get(id, Comps.Transform);
        if (!xform) return;
        const x = entityData[SnapshotIndices.POS_X];
        const y = entityData[SnapshotIndices.POS_Y];
        const z = entityData[SnapshotIndices.POS_Z];

        const dx = xform.pos.x - x;
        const dy = xform.pos.y - y;
        const dz = xform.pos.z - z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 0.2) {
            xform.targetPos.set(0, 0, 0);
        } else {
            xform.targetPos.set(x, y, z);
        }
    }

    sendInputs(world: SolWorld) {
        const input = world.getSingleton(LocalInput);
        const now = performance.now();
        this.clientTickTime.set(world.stepCount, now);
        if (this.clientTickTime.size > 200) {
            const cutoff = world.stepCount - 200;
            for (const key of this.clientTickTime.keys()) {
                if (key < cutoff) this.clientTickTime.delete(key);
            }
        }

        const payload = [
            world.stepCount,
            input.heldMask,
            Math.round(input.yaw * 1000) / 1000,
            Math.round(input.pitch * 1000) / 1000,
        ]
        this.io.emit("i", payload);
    }

    private reconcilePlayer(world: SolWorld, id: number, sX: number, sY: number, sZ: number, entityData: EntityState) {
        if (!world.entities.has(id)) {
            this.handleSpawn(world, entityData, NetworkRole.LOCAL);
        }
        const xform = world.get(id, Comps.Transform);
        if (!xform) return;

        const dx = xform.pos.x - sX;
        const dy = xform.pos.y - sY;
        const dz = xform.pos.z - sZ;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 0.2) {
            xform.targetPos.set(0, 0, 0);
        } else {
            xform.targetPos.set(sX, sY, sZ);
        }
    }

    private getInterpolationSnaps(world: SolWorld) {
        if (!this.s0 || !this.s1) return null;
        const duration = this.s1.t - this.s0.t;
        const elapsed = performance.now() - this.lastRecieved;
        const alpha = duration > 0 ? Math.min(1, elapsed / duration) : 1;
        return { s0: this.s0, s1: this.s1, alpha };
    }

    private handleSpawn(world: SolWorld, data: EntityState, role: NetworkRole) {
        const newId = world.spawn({
            role,
            type: data[SnapshotIndices.TYPE],
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(data[SnapshotIndices.POS_X], data[SnapshotIndices.POS_Y], data[SnapshotIndices.POS_Z]) } },
                { type: Comps.Movement, data: { yaw: data[SnapshotIndices.YAW] } },
                { type: Comps.Animation, data: { current: data[SnapshotIndices.MOVESTATE] ?? "idle" } }
            ]
        })
        const ownerId = data[SnapshotIndices.OWNERID];
        if (ownerId) world.add(newId, Comps.Owner, { ownerId });
    }

    private handleTransform(world: SolWorld, id: number, s1: EntityState, alpha: number) {
        const xform = world.get(id, Comps.Transform);
        if (xform) {
            const s0 = this._snap0Map.get(id)!;
            if (s0) {
                xform.pos.x = lerp(s0[SnapshotIndices.POS_X], s1[SnapshotIndices.POS_X], alpha);
                xform.pos.y = lerp(s0[SnapshotIndices.POS_Y], s1[SnapshotIndices.POS_Y], alpha);
                xform.pos.z = lerp(s0[SnapshotIndices.POS_Z], s1[SnapshotIndices.POS_Z], alpha);
            } else {
                xform.pos.x = s1[SnapshotIndices.POS_X];
                xform.pos.y = s1[SnapshotIndices.POS_Y];
                xform.pos.z = s1[SnapshotIndices.POS_Z];
            }
        }
    }

    private switchPawn(world: SolWorld, localUser: UserComp, id: number) {
        if (localUser.pawnId) {
            const phys = world.get(localUser.pawnId, Comps.Physics);
            if (phys) {
                phys?.body?.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
            }
            world.removeComponent(localUser.pawnId, Comps.Owner);
            world.removeComponent(localUser.pawnId, Comps.Local);
        }

        localUser.pawnId = id;
        world.add(id, Comps.Owner, { ownerId: localUser.entityId });

        const phys = world.get(id, Comps.Physics);
        if (phys?.body) {
            bodyPhysChange(phys, true);
        }
    }
}