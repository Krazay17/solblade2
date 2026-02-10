import type { CNet } from "#/client/core/CNet";
import { Comps, type ISystem } from "#/common/core/ECS";
import { type SolWorld } from "#/common/core/SolWorld";
import { lerp } from "three/src/math/MathUtils.js";
import { LocalInput } from "#/client/core/LocalInput";
import { SolVec3 } from "#/common/core/SolMath";
import { SnapshotIndices, type EntityState, type Snapshot, type UserState } from "#/common/core/SolTypes";
import type { ClientLoop } from "#/client/core/ClientLoop";
import RAPIER from "@dimforge/rapier3d-compat";
import type { TInputBuffer, UserComp } from "#/common/modules/controller/UserComp";
import { bodyPhysChange } from "#/common/core/PhysicsFactory";
import { type IJoinData } from "#/server/core/ServerSyncSystem";
import solSave from "#/client/core/SolSave";
import { NetworkRole } from "#/common/core/SolConstants";

export class ClientSyncSystem implements ISystem {
    private snapshotBuffer: Snapshot[] = [];
    private _snap0Map = new Map<number, EntityState>();
    private bound = false;
    public isSynced = false;
    private clientTickTime = new Map<number, number>();
    public rtt: number = 0;
    public ping: number = 0;
    private lastRecieved = 0;

    private myUID: string;

    private serverToLocal = new Map<number, number>();
    private uidToEntity = new Map<string, number>();

    private _world: SolWorld | null = null;
    get world() { return this._world!; }
    set world(w: SolWorld) { this._world = w; }

    constructor(private io: CNet, private clientLoop: ClientLoop) {
        this.myUID = solSave.uid;
    }

    join() {
        if (!this.io.connected) {
            this.io.connect();
        }
        if (!this.bound) {
            this.bound = true;
            this.io.socket.on("connect", () => this.sendJoinData());
            this.io.on("s", (s: Snapshot) => this.onSnapshot(s));
            this.io.on("welcome", (data: any) => this.handleWelcome(data));
            this.io.socket.on("disconnect", () => this.handleDisconnect());
        }
        this.sendJoinData();
    }

    handleDisconnect() {
        this.desync();
        console.log("disconnected");
    }

    handleWelcome(data: { userId: number, pawnId: number }) {
        const world = this.world;
        const myLocalUserId = world.localId;
        const user = world.get(myLocalUserId, Comps.User)!;

        this.serverToLocal.set(data.userId, myLocalUserId);
        this.serverToLocal.set(data.pawnId, user.pawnId!);
        this.uidToEntity.set(this.myUID, myLocalUserId);
        this.isSynced = true;
    }

    desync() {
        this.isSynced = false;
        this.snapshotBuffer.length = 0;
        this.clientTickTime.clear();
    }

    private sendJoinData(world: SolWorld = this.world) {
        const eType = world.get(world.localId, Comps.Meta)!.type ?? null;
        const joinData: IJoinData = {
            name: solSave.name,
            mapIndex: world.mapIndex,
            uid: solSave.uid,
            pawnType: eType,
        }
        this.io.emit("join", joinData);
    }

    onSnapshot(snapshot: Snapshot) {
        if (!this.isSynced) return;
        this.snapshotBuffer.push(snapshot);
        this.lastRecieved = performance.now();
        if (this.snapshotBuffer.length > 30) this.snapshotBuffer.shift();
    }

    preStep(world: SolWorld) {
        const now = performance.now();
        if (!this.isSynced || !this.snapshotBuffer) return;
        this.sendInputs(world, now);

        const snaps = this.getInterpolationSnaps(world, now);
        if (!snaps) return;
        const { s0, s1, alpha } = snaps;

        this._snap0Map.clear();
        for (const e of s0.e) this._snap0Map.set(e[SnapshotIndices.ID], e);

        const localUser = world.get(world.localId, Comps.User)!;
        this.syncUser(world, s1.us!, localUser, now);

        for (const eState of s1.e) {
            this.syncActors(world, eState, alpha, now);
        }
    }

    syncUser(world: SolWorld, uState: UserState, localUser: UserComp, now: number) {
        if (!uState) return;
        const [sEID, uUID, lastTime, lastSeq, sPawnId] = uState;

        if (uUID === this.myUID) {
            //const sentTime = this.clientTickTime.get(lastSeq);
            const sentTime = lastTime;
            if (sentTime) {
                const rtt = now - sentTime;
                this.rtt = Math.round((this.rtt * 0.9) + (rtt * 0.1));
            }
        }

        // Maintain local mapping for this user
        const lpawnId = this.serverToLocal.get(sPawnId);
        let lEID = this.uidToEntity.get(uUID);
        if (lEID !== undefined) {
            this.serverToLocal.set(sEID, lEID);
            if (uUID === this.myUID && lpawnId && lpawnId !== localUser.pawnId) {
                this.switchPawn(world, localUser, lpawnId);
            }
        }
    }

    syncActors(world: SolWorld, eState: EntityState, alpha: number, now: number) {
        const [sEID, active, type, sOwnerId, iid] = eState;
        let lEID = this.serverToLocal.get(sEID);

        const lOwnerId = this.serverToLocal.get(sOwnerId) ?? 0;
        const isMine = lOwnerId === world.localId && lOwnerId !== 0;

        if (!lEID || !world.entities.has(lEID)) {
            const existing = world.query([Comps.Owner]).find(e => {
                const owner = world.get(e, Comps.Owner)!;
                return iid && owner.iid === iid;
            })
            if (existing) {
                lEID = existing;
                this.serverToLocal.set(sEID, existing);
            } else {
                lEID = this.handleSpawn(world, eState, isMine);
            }
        }

        const remote = world.get(lEID, Comps.Remote);
        if (remote) remote.lastSeen = now;

        if (sOwnerId) world.add(lEID, Comps.Owner, { ownerId: lOwnerId, iid });
        else world.removeComponent(lEID, Comps.Owner);

        if (isMine) {
            this.reconcileLocal(world, lEID, eState);
            return;
        } else {
            this.handleTransform(world, lEID, sEID, eState, alpha);
        }

        this.syncComponents(world, lEID, eState);
    }

    syncComponents(world: SolWorld, id: number, eState: EntityState) {
        const move = world.get(id, Comps.Movement);
        const ability = world.get(id, Comps.Ability);
        if (move) {
            move.yaw = eState[SnapshotIndices.YAW];
            move.state = eState[SnapshotIndices.MOVESTATE] ?? move.state;
        }
        if (ability) {
            ability.requestedState = eState[SnapshotIndices.ABILITYSTATE] ?? null;
        }
    }
    private _tempVec = new SolVec3();
    private _tempVecV = new SolVec3();
    reconcileLocal(world: SolWorld, id: number, eState: EntityState) {
        const xform = world.get(id, Comps.Transform);
        if (!xform) return;
        const x = eState[SnapshotIndices.POS_X];
        const y = eState[SnapshotIndices.POS_Y];
        const z = eState[SnapshotIndices.POS_Z];
        const vx = eState[SnapshotIndices.VEL_X];
        const vy = eState[SnapshotIndices.VEL_Y];
        const vz = eState[SnapshotIndices.VEL_Z];
        this._tempVec.set(x, y, z);
        this._tempVecV.set(vx, vy, vz);

        const distSq = SolVec3.distanceToSquared(this._tempVec, xform.pos);
        const interp = Math.min(1, Math.max(0.2, distSq * .2))
        const phys = world.get(id, Comps.Physics);
        if (!phys?.body) return;
        phys?.body?.setTranslation(xform.pos.lerp(this._tempVec, interp), true);
        phys?.body?.setLinvel(SolVec3.lerp(phys.body.linvel(), this._tempVecV, interp), true);
    }

    sendInputs(world: SolWorld, now: number) {
        const user = world.get(world.localId, Comps.User)!;
        const input = world.getSingleton(LocalInput);
        this.clientTickTime.set(world.stepCount, now);
        if (this.clientTickTime.size > 200) {
            const cutoff = world.stepCount - 200;
            for (const key of this.clientTickTime.keys()) {
                if (key < cutoff) this.clientTickTime.delete(key);
            }
        }

        this.io.emit("i", [
            user.time,
            user.lastProcessedSeq,
            user.actions.held,
            Math.round(input.yaw * 1000) / 1000,
            Math.round(input.pitch * 1000) / 1000,
        ]);
    }

    private getInterpolationSnaps(world: SolWorld, now: number) {
        if (this.snapshotBuffer.length < 2) return null;
        const rtt = now - this.snapshotBuffer?.[this.snapshotBuffer.length - 1].t;
        this.ping = Math.round((this.ping * 0.9) + (rtt * 0.1))
        const interpolationDelay = this.ping;
        const renderTime = now - interpolationDelay;

        while (this.snapshotBuffer.length > 2 && this.snapshotBuffer[1].t < renderTime) {
            this.snapshotBuffer.shift();
        }

        const s0 = this.snapshotBuffer[0];
        const s1 = this.snapshotBuffer[1];
        if (!s0 || !s1) {
            return null;
        }
        const duration = s1.t - s0.t;
        const alpha = duration > 0 ? (renderTime - s0.t) / duration : 1;

        return { s0, s1, alpha: Math.max(0, Math.min(1, alpha)) };
    }

    private handleSpawn(world: SolWorld, data: EntityState, mine: boolean) {
        const sEID = data[SnapshotIndices.ID];
        const role = mine ? NetworkRole.LOCAL : NetworkRole.REMOTE;
        const newId = world.spawn({
            type: data[SnapshotIndices.TYPE],
            role,
            components: [
                {
                    type: Comps.Transform, data: {
                        pos: new SolVec3(data[SnapshotIndices.POS_X], data[SnapshotIndices.POS_Y], data[SnapshotIndices.POS_Z])
                    }
                },
            ]
        });
        this.serverToLocal.set(sEID, newId);
        return newId;
    }

    private handleTransform(world: SolWorld, lEID: number, sEID: number, s1: EntityState, alpha: number) {
        const xform = world.get(lEID, Comps.Transform);
        if (xform) {
            const s0 = this._snap0Map.get(sEID);
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

    private switchPawn(world: SolWorld, localUser: UserComp, lPawnId: number) {
        if (localUser.pawnId && world.entities.has(localUser.pawnId)) {
            const phys = world.get(localUser.pawnId, Comps.Physics);
            if (phys?.body) {
                phys.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
            }
            world.add(localUser.pawnId, Comps.Remote);
            world.removeComponent(localUser.pawnId, Comps.Owner);
            world.removeComponent(localUser.pawnId, Comps.Local);
        }

        localUser.pawnId = lPawnId;
        world.add(lPawnId, Comps.Owner, { ownerId: localUser.entityId });

        const phys = world.get(lPawnId, Comps.Physics);
        if (phys) {
            bodyPhysChange(phys, true);
            world.removeComponent(lPawnId, Comps.Remote);
            world.add(lPawnId, Comps.Local);
        }
    }
}