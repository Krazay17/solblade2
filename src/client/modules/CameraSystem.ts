import * as THREE from 'three';
import { SolQuat, SolVec3 } from "@/common/core/SolMath";
import type { World } from "@/common/core/World";
import { LocalUser } from "@/client/modules/LocalUser";
import { PhysicsComp } from "@/common/modules/components/PhysicsComp";
import type { ISystem } from "@/common/modules/System";
import { CameraArm } from "./CameraArm";
import type { Rendering } from '../core/Rendering';
import RAPIER from '@dimforge/rapier3d-compat';

export class CameraSystem implements ISystem {
    tempQuat = new SolQuat();
    tempDir = new SolVec3();
    camera: THREE.PerspectiveCamera;
    arm: CameraArm;
    probe: RAPIER.Ball;
    private _tempQuat = new RAPIER.Quaternion(0, 0, 0, 1);

    constructor(private rendering: Rendering) {
        this.camera = rendering.camera;
        this.arm = new CameraArm();
        this.arm.yawObject.add(this.arm.pitchObject);
        this.arm.pitchObject.add(this.camera);
        this.rendering.scene.add(this.arm.yawObject);
        this.probe = new RAPIER.Ball(1);

    }
    postUpdate(world: World, dt: number, time: number, alpha: number) {
        const localUser = world.getSingleton(LocalUser);

        this.arm.yawObject.rotation.y = localUser.yaw;
        this.arm.pitchObject.rotation.x = localUser.pitch;

        // 1. Sync Objects
        if (localUser.entityId === -1) return;
        const phys = world.get(localUser.entityId, PhysicsComp);
        if (!phys) return;

        // 2. Interpolate Focus Point (Head)
        const headOffset = 0.6; // Adjust based on character height
        this.tempDir.set(
            phys.lastPos.x + (phys.pos.x - phys.lastPos.x) * alpha,
            phys.lastPos.y + (phys.pos.y - phys.lastPos.y) * alpha + headOffset,
            phys.lastPos.z + (phys.pos.z - phys.lastPos.z) * alpha
        );
        this.arm.yawObject.position.set(this.tempDir.x, this.tempDir.y, this.tempDir.z);

        // 3. Calculate Direction Vector for Raycast
        // We want the direction from the Head to the Camera
        const theta = localUser.yaw;
        const phi = localUser.pitch;

        const dirX = Math.sin(theta) * Math.cos(phi);
        const dirY = -Math.sin(phi);
        const dirZ = Math.cos(theta) * Math.cos(phi);

        // 4. Raycast for Collision
        const rayOrigin = this.arm.yawObject.position; // Player Head
        const rayDir = { x: dirX, y: dirY, z: dirZ };
        const maxDist = this.arm.targetDistance; // e.g., 5.0

        const hit = world.physWorld.castShape(
            rayOrigin,
            this._tempQuat,
            rayDir,
            this.probe,
            maxDist,
            true,
            RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
            undefined,
            undefined,
            undefined,
            (collider) => collider.parent()?.handle !== phys.body?.handle // Don't hit self
        );

        let desiredDistance = maxDist;
        if (hit) {
            // Pull the camera in to the hit point, with a tiny buffer (0.2)
            desiredDistance = Math.max(1, hit.toi - 0.2);
        }

        // 5. Smooth the Camera Zoom (Spring effect)
        this.arm.currentDistance += (desiredDistance - this.arm.currentDistance);
        this.camera.position.z = this.arm.currentDistance;
    }
}