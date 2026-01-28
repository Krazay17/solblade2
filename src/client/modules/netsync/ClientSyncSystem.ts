import type { CNet } from "#/client/core/CNet";
import type { ISystem, Snapshot } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import { MovementComp } from "#/common/modules";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { lerp } from "three/src/math/MathUtils.js";
import { AnimationComp } from "../animation/AnimationComp";
import { LocalInput } from "#/client/core/LocalInput";
import { UserComp } from "#/common/modules/user/UserComp";
import { SolVec3 } from "#/common/core/SolMath";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";

export class ClientSyncSystem implements ISystem {
    private localUser: UserComp;
    snapshotBuffer: Snapshot[] = [];
    private INTERPOLATION_OFFSET = 100; // Render the world 100ms in the past

    constructor(private io: CNet, private world: World) {
        this.localUser = world.getSingleton(UserComp);
        this.io.on("s", (s: Snapshot) => this.snapshotBuffer.push(s));
        this.io.on("welcome", (data: { userId: number, pawnId: number }) => {
            if (this.localUser.pawnId && world.entities.has(this.localUser.pawnId)) {
                this.world.removeEntity(this.localUser.pawnId);
            }
            this.world.spawn(NetworkRole.LOCAL, EntityTypes.player, data.pawnId, {
                TransformComp: { pos: new SolVec3(0, 5, 0) }
            });
            this.localUser.pawnId = data.pawnId;
            this.localUser.entityId = data.userId;

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
        this.sendInputs(world);
        const renderTime = Date.now() - this.INTERPOLATION_OFFSET;

        // 1. Find the two snapshots to interpolate between
        const snaps = this.getInterpolationSnaps(renderTime);
        if (!snaps) return;

        const { s0, s1, alpha } = snaps;

        for (const entityData of s1.e) {
            const [id, active, type, x, y, z, yaw, animState] = entityData;

            if (id === world.getSingleton(UserComp).pawnId) {
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
                        current: animState
                    }
                });
                continue;
            }

            const xform = world.get(id, TransformComp);
            const move = world.get(id, MovementComp);
            const anim = world.get(id, AnimationComp);

            // 4. Interpolate! 
            // We find the same entity in s0 to get the "from" position
            const s0Data = s0.e.find(e => e[0] === id);
            if (s0Data && xform) {
                xform.pos.x = lerp(s0Data[3], x, alpha);
                xform.pos.y = lerp(s0Data[4], y, alpha);
                xform.pos.z = lerp(s0Data[5], z, alpha);
                // Update non-interpolated state immediately
                if (move) {
                    move.yaw = yaw;
                }
                if (anim) {
                    anim.current = animState;
                }
            }
        }
    }

    private getInterpolationSnaps(time: number) {
        if (this.snapshotBuffer.length < 2) return null;

        // Find s1 (the first snap newer than our target time)
        let i = 0;
        for (; i < this.snapshotBuffer.length; i++) {
            if (this.snapshotBuffer[i].t > time) break;
        }

        const s0 = this.snapshotBuffer[i - 1];
        const s1 = this.snapshotBuffer[i];

        if (!s0 || !s1) return null;

        const alpha = (time - s0.t) / (s1.t - s0.t);
        return { s0, s1, alpha };
    }
}