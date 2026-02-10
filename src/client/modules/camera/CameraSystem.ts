import * as THREE from 'three';
import { SolQuat, SolVec3 } from "#/common/core/SolMath";
import type { SolWorld } from "#/common/core/SolWorld";
import { Comps, type ISystem } from "#/common/core/ECS"
import { CameraArm } from "./CameraArm";
import type { Rendering } from '../../core/Rendering';
import RAPIER from '@dimforge/rapier3d-compat';
import { COLLISION_GROUPS, SOL_PHYS } from '#/common/core/SolConstants';
import { lerp } from 'three/src/math/MathUtils.js';

export class CameraSystem implements ISystem {
    tempQuat = new SolQuat();
    private _forwardVec = new SolVec3();
    private _interpVec = new SolVec3();
    private _interpVec2 = new SolVec3();
    private _offset = new SolVec3();
    private rayDir = new SolVec3();
    camera: THREE.PerspectiveCamera;
    private _tempQuat = new RAPIER.Quaternion(0, 0, 0, 1);

    constructor(private rendering: Rendering, private cameraArm: CameraArm) {
        this.camera = rendering.camera;
        this.cameraArm.pitchObject.add(this.camera);
        this.rendering.scene.add(this.cameraArm.yawObject);
    }

    postUpdate(world: SolWorld, dt: number, time: number, alpha: number) {
        const localUser = world.get(world.localId, Comps.User)!;
        if (!localUser) return;
        this.cameraArm.yawObject.rotation.y = localUser.yaw;
        this.cameraArm.pitchObject.rotation.x = localUser.pitch;
        if (!localUser.pawnId) return;
        const xform = world.get(localUser.pawnId, Comps.Transform);
        if (!xform) return;

        this._interpVec.copy(xform.lastPos).lerp(xform.pos, alpha);
        this._forwardVec.fromPitchYaw(localUser.pitch, localUser.yaw);
        const rightVec = this._forwardVec.clone().cross(SOL_PHYS.WORLD_UP);
        this._offset.copy(SOL_PHYS.WORLD_UP).multiplyScalar(0.5).add(rightVec.multiplyScalar(1.2));
        const targetPos = this._interpVec2.copy(this._interpVec).add(this._offset);
        this.cameraArm.yawObject.position.lerp(targetPos, 1 - Math.exp(-30*dt));

        this.rayDir.fromPitchYaw(localUser.pitch, localUser.yaw).negate();

        // 4. Raycast for Collision
        const rayOrigin = this.cameraArm.yawObject.position; // Player Head
        const maxDist = this.cameraArm.targetDistance; // e.g., 5.0
        const hit = world.physWorld.castShape(
            rayOrigin,
            this._tempQuat,
            this.rayDir,
            this.cameraArm.probe,
            0,
            maxDist,
            true,
            undefined,
            (COLLISION_GROUPS.RAY << 16 | COLLISION_GROUPS.WORLD),
            undefined,
            undefined,
            undefined
        );

        let desiredDistance = maxDist;
        if (hit) {
            // Pull the camera in to the hit point, with a tiny buffer (0.2)
            desiredDistance = Math.max(1, hit.time_of_impact - 0.2);
        }

        // 5. Smooth the Camera Zoom (Spring effect)
        this.cameraArm.currentDistance += (desiredDistance - this.cameraArm.currentDistance);
        this.camera.position.z = this.cameraArm.currentDistance;
    }
}