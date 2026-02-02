import type { CNet } from "#/client/core/CNet";
import { Comps, type ISystem } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import { lerp } from "three/src/math/MathUtils.js";
import { LocalInput } from "#/client/core/LocalInput";
import { UserComp } from "#/common/modules/controller/UserComp";
import { SolVec3 } from "#/common/core/SolMath";
import { EntityTypes, INTERPOLATION, NetworkRole } from "#/common/core/SolConstants";
import { SnapshotIndices, type EntityState, type Snapshot } from "#/common/core/SolTypes";

export class ClientSyncSystem implements ISystem {
    snapshotBuffer: Snapshot[] = [];
    private _snap0Map = new Map<number, EntityState>();
    private bound = false;
    private isSynced = false;
    private clientTickTime = new Map<number, number>();
    public ping: number = 0;

    constructor(private io: CNet) { }

    join(world: World) {
        if (!this.bound) {
            this.bound = true;
            this.io.emit("join");
            this.io.socket.on("connect", () => this.io.emit("join"));
            this.io.on("s", (s: Snapshot) => this.snapshotBuffer.push(s));

            this.io.on("welcome", (data: { userId: number, pawnId: number }) => {
                // 1. Retrieve old ID from World property (not Singleton)
                const oldUserId = world.localId;

                // 2. Cleanup old placeholders
                if (oldUserId !== -1 && world.entities.has(oldUserId)) {
                    // Get old data before destroying if needed
                    const oldUser = world.get(oldUserId, Comps.User);
                    if (oldUser?.pawnId) world.removeEntity(oldUser.pawnId);

                    world.removeEntity(oldUserId);
                }

                // 3. Spawn Authoritative Entity
                world.spawn({ id: data.userId });

                // 4. Create NEW Component with transferred data
                const user = world.add(data.userId, Comps.User, {
                    pawnId: data.pawnId,
                    socketId: this.io.socket.id!
                });

                // 5. Update Global Reference
                world.localId = data.userId;

                console.log(`Synced with Server. User: ${data.userId}, Pawn: ${data.pawnId}`);
                this.isSynced = true;
            });
        }
    }

    sendInputs(world: World) {
        const input = world.getSingleton(LocalInput);
        const payload = [
            world.stepCount,
            input.heldMask,
            Math.round(input.yaw * 1000) / 1000,
            Math.round(input.pitch * 1000) / 1000,
        ]
        this.io.emit("i", payload);
    }
    preStep(world: World, dt: number, time: number) {
        if (!this.isSynced) return;
        this.sendInputs(world);
        const renderTime = Date.now() - INTERPOLATION.OFFSET;
        const localUser = world.get(world.localId, Comps.User)!;
        this.clientTickTime.set(world.stepCount, renderTime);
        const snaps = this.getInterpolationSnaps(renderTime);
        if (!snaps) return;

        const { s0, s1, alpha } = snaps;
        this._snap0Map.clear();
        for (const e of s0.e) {
            this._snap0Map.set(e[0], e);
        }
        for (const us of s1.us) {
            const id = us[0];
            if (id === localUser.entityId) {
                const sentTime = this.clientTickTime.get(us[1]);
                if (sentTime) {
                    this.ping = (Math.round((this.ping * 0.9) + (renderTime - sentTime) * 0.1));
                }
            }
        }
        for (const entityData of s1.e) {
            const [id, active, type, ownerId, ownerStep, x, y, z, yaw, moveState, abilityState] = entityData;
            if (id === localUser.entityId) {
                continue;
            }
            if (!active) {
                world.removeEntity(id);
                continue;
            }
            if (id === localUser.pawnId) {
                this.reconcilePlayer(world, id, x, y, z, entityData);
                continue;
            }
            // RECONCILIATION: Check for Predicted Entities
            // If this entity belongs to us, check if we have a local prediction for it
            if (ownerId === localUser.entityId) {
                // Find a local entity that matches the prediction key (Owner + Step)
                // Note: We search for Local components to ensure we only reap predictions
                const predictedId = world.query([Comps.Owner, Comps.Local])
                    .find(eid => {
                        const o = world.get(eid, Comps.Owner)!;
                        return o.ownerId === ownerId && o.step === ownerStep;
                    });

                if (predictedId) {
                    world.removeEntity(predictedId);
                }
            }
            if (!world.entities.has(id)) {
                this.handleSpawn(world, entityData, NetworkRole.REMOTE);
                continue;
            }
            if (ownerId) {
                world.add(id, Comps.Owner).setOwnerId(ownerId);
                if (ownerId === localUser.entityId) {
                    console.log(ownerStep);
                }
            }
            const remote = world.get(id, Comps.Remote);
            if (remote) remote.lastSeenServerTime = s1.t;

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
    private reconcilePlayer(world: World, id: number, sX: number, sY: number, sZ: number, entityData: EntityState) {
        if (!world.entities.has(id)) {
            this.handleSpawn(world, entityData, NetworkRole.LOCAL);
            return;
        }
        const xform = world.get(id, Comps.Transform);
        if (!xform) return;

        // 1. Calculate squared distance to avoid Math.sqrt
        const dx = xform.pos.x - sX;
        const dy = xform.pos.y - sY;
        const dz = xform.pos.z - sZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        // 2. Hard snap if error is massive (e.g., > 10 units)
        if (distSq > 100) {
            xform.pos.set(sX, sY, sZ);
            xform.targetPos.set(0, 0, 0);
            return;
        }

        // 3. Smooth correct if error is significant (e.g., > 0.1 units)
        if (distSq > 0.1) {
            xform.targetPos.set(sX, sY, sZ);
        } else xform.targetPos.set(0, 0, 0);
    }

    private getInterpolationSnaps(renderTime: number) {
        // Drop snapshots older than our interpolation target
        while (this.snapshotBuffer.length > 2 && this.snapshotBuffer[1].t < renderTime) {
            this.snapshotBuffer.shift();
        }

        if (this.snapshotBuffer.length < 2) return null;

        const s0 = this.snapshotBuffer[0];
        const s1 = this.snapshotBuffer[1];

        // Ensure the renderTime actually falls between these two
        if (renderTime < s0.t || renderTime > s1.t) return null;

        const alpha = (renderTime - s0.t) / (s1.t - s0.t);
        return { s0, s1, alpha };
    }
    private handleSpawn(world: World, data: EntityState, role: NetworkRole) {
        const newId = world.spawn({
            role,
            type: data[SnapshotIndices.TYPE],
            id: data[SnapshotIndices.ID],
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(data[SnapshotIndices.POS_X], data[SnapshotIndices.POS_Y], data[SnapshotIndices.POS_Z]) } },
                { type: Comps.Movement, data: { yaw: data[SnapshotIndices.YAW] } },
                { type: Comps.Animation, data: { current: data[SnapshotIndices.MOVESTATE] ?? "idle" } }
            ]
        })
        const ownerId = data[SnapshotIndices.OWNERID];
        const ownerStep = data[SnapshotIndices.OWNERSTEP];
        if (ownerId)
            world.add(newId, Comps.Owner).setOwnerId(ownerId).setStep(ownerStep);
    }
    private handleTransform(world: World, id: number, s1: EntityState, alpha: number) {
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
}