import type { CNet } from "#/client/core/CNet";
import type { ISystem } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import { MovementComp, PhysicsComp } from "#/common/modules";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { lerp } from "three/src/math/MathUtils.js";
import { AnimationComp } from "../animation/AnimationComp";
import { LocalInput } from "#/client/core/LocalInput";
import { UserComp } from "#/common/modules/user/UserComp";
import { SolVec3 } from "#/common/core/SolMath";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { RemoteComp } from "#/common/modules/network/RemoteComp";
import { SnapshotIndices, type Snapshot } from "#/server/core/ServerSyncSystem";
import { AbilityComp } from "#/common/modules/ability/AbilityComp";
import { OwnerComp } from "#/common/modules/user/OwnerComp";

export class ClientSyncSystem implements ISystem {
    snapshotBuffer: Snapshot[] = [];
    private _snap0Map = new Map<number, any>();
    private INTERPOLATION_OFFSET = 100; // Render the world 100ms in the past
    private bound = false;
    private isSynced = false;

    constructor(private io: CNet) { }

    join(world: World) {
        this.io.join();
        if (this.bound) return;
        this.bound = true;
        this.io.on("s", (s: Snapshot) => this.snapshotBuffer.push(s));
        this.io.on("welcome", (data: { userId: number, pawnId: number }) => {
            const user = world.getSingleton(UserComp);
            const oldUserId = user.entityId;
            const oldPawnId = user.pawnId;
            console.log(oldPawnId);

            let pos = new SolVec3(0, 5, 0);
            // 2. Cleanup the local-only placeholder entities (ID 1 and 2)
            if (world.entities.has(oldUserId)) world.removeEntity(oldUserId);
            if (oldPawnId && world.entities.has(oldPawnId)) {
                const xform = world.get(oldPawnId, TransformComp);
                if (xform) pos = xform.pos
                world.removeEntity(oldPawnId);
            }

            // 3. Spawn the NEW user entity using the Server ID
            // IMPORTANT: Use EntityTypes.none so spawn doesn't create a fresh UserComp
            world.spawn(NetworkRole.LOCAL, EntityTypes.none, data.userId);

            // 4. INJECT the existing singleton instance into the new entity
            world.add(data.userId, user);

            world.spawn(NetworkRole.LOCAL, EntityTypes.player, data.pawnId, {
                TransformComp: { pos }
            });
            world.add(data.pawnId, OwnerComp).setOwnerId(data.userId).setStep(user.lastProcessedSeq);
            user.entityId = data.userId;
            user.pawnId = data.pawnId;
            user.socketId = this.io.socket.id!;

            this.isSynced = true;

            console.log(`Successfully synced with Server Pawn ID: ${data.pawnId}`);
        });
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
        if(!this.isSynced)return;
        this.sendInputs(world);
        const renderTime = Date.now() - this.INTERPOLATION_OFFSET;

        // 1. Find the two snapshots to interpolate between
        const snaps = this.getInterpolationSnaps(renderTime);
        if (!snaps) return;

        const { s0, s1, alpha } = snaps;

        this._snap0Map.clear();
        for (const e of s0.e) {
            this._snap0Map.set(e[0], e);
        }
        for (const entityData of s1.e) {
            const [id, active, type, ownerId, ownerStep, x, y, z, yaw, moveState, abilityState] = entityData;
            const localUser = world.getSingleton(UserComp);
            const remote = world.get(id, RemoteComp);

            if(ownerId === localUser.entityId) {
                // something like this?
            }

            if (remote) remote.lastSeenServerTime = s1.t;


            if (id === localUser.pawnId) {
                this.reconcilePlayer(world, id, x, y, z);
                continue;
            }

            if (!active) {
                world.removeEntity(id);
                continue;
            }

            if (!world.entities.has(id)) {
                world.spawn(NetworkRole.REMOTE, type, id, {
                    TransformComp: {
                        pos: new SolVec3(x, y, z)
                    },
                    MovementComp: {
                        yaw
                    },
                    AnimationComp: {
                        current: abilityState
                    }
                });
                continue;
            }
            const s0Data = this._snap0Map.get(id);
            const xform = world.get(id, TransformComp);
            const move = world.get(id, MovementComp);
            const ability = world.get(id, AbilityComp);
            if (xform) {
                if (s0Data) {
                    xform.pos.x = lerp(s0Data[SnapshotIndices.POS_X], x, alpha);
                    xform.pos.y = lerp(s0Data[SnapshotIndices.POS_Y], y, alpha);
                    xform.pos.z = lerp(s0Data[SnapshotIndices.POS_Z], z, alpha);
                } else {
                    xform.pos.x = x;
                    xform.pos.y = y;
                    xform.pos.z = z;
                }
            }
            if (move) {
                move.yaw = yaw;
                move.state = moveState ?? move.state;
            }
            if (ability) {
                console.log(abilityState);
                ability.state = abilityState ?? ability.state;
            }
        }
    }
    private reconcilePlayer(world: World, id: number, sX: number, sY: number, sZ: number) {
        const xform = world.get(id, TransformComp);
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
}