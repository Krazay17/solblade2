import * as THREE from 'three';
import { SolQuat, SolVec3 } from "#/common/core/SolMath";
import type { SolWorld } from "#/common/core/SolWorld";
import { Comps, type ISystem } from "#/common/core/ECS"
import { CameraArm } from "./CameraArm";
import type { Rendering } from '../../core/Rendering';
import RAPIER from '@dimforge/rapier3d-compat';
import { COLLISION_GROUPS } from '#/common/core/SolConstants';

export class CameraSystem implements ISystem {
    tempQuat = new SolQuat();
    tempDir = new SolVec3();
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
        if(!localUser)return;
        this.cameraArm.yawObject.rotation.y = localUser.yaw;
        this.cameraArm.pitchObject.rotation.x = localUser.pitch;

        // 1. Sync Objects
        if (!localUser.pawnId) return;
        const xform = world.get(localUser.pawnId, Comps.Transform);
        if (!xform) return;

        // 2. Interpolate Focus Point (Head)
        const headOffset = 0.6; // Adjust based on character height
        this.tempDir.set(
            xform.lastPos.x + (xform.pos.x - xform.lastPos.x) * alpha,
            xform.lastPos.y + (xform.pos.y - xform.lastPos.y) * alpha + headOffset,
            xform.lastPos.z + (xform.pos.z - xform.lastPos.z) * alpha
        );
        this.cameraArm.yawObject.position.set(this.tempDir.x, this.tempDir.y, this.tempDir.z);

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