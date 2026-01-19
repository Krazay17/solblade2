import * as THREE from 'three';
import { SolQuat, SolVec3 } from "@/common/core/SolMath";
import type { World } from "@/common/core/World";
import { LocalUser } from "@/client/modules/LocalUser";
import { PhysicsComp } from "@/common/modules/components/PhysicsComp";
import type { ISystem } from "@/common/modules/System";
import { CameraArm } from "./CameraArm";
import type { Rendering } from '../core/Rendering';

export class CameraSystem implements ISystem {
    tempQuat = new SolQuat();
    tempDir = new SolVec3();
    camera: THREE.PerspectiveCamera;
    arm: CameraArm;

    constructor(private rendering: Rendering) {
        this.camera = rendering.camera;
        this.arm = new CameraArm();
        this.arm.yawObject.add(this.arm.pitchObject);
        this.arm.pitchObject.add(this.camera);
        this.rendering.scene.add(this.arm.yawObject);

    }
    postUpdate(world: World, dt: number, time: number, alpha: number) {
        const localUser = world.getSingleton(LocalUser);
        const phys = world.get(localUser.entityId, PhysicsComp);
        if (localUser.entityId === -1) return;
        if (!phys) return;
        // 1. Interpolate Player Position (The "Focus" point)
        // We follow the player's head, not their feet
        const headOffset = 0.5;
        const focusX = phys.lastPos.x + (phys.pos.x - phys.lastPos.x) * alpha;
        const focusY = phys.lastPos.y + (phys.pos.y - phys.lastPos.y) * alpha + headOffset;
        const focusZ = phys.lastPos.z + (phys.pos.z - phys.lastPos.z) * alpha;

        // 2. Set the "Arm" position (Yaw Object) to the Player
        this.arm.yawObject.position.set(focusX, focusY, focusZ);

        // 3. Apply localUser Input
        // Pitch (up/down) is rotation around X-axis
        // Yaw (left/right) is rotation around Y-axis
        this.arm.yawObject.rotation.y = localUser.yaw;
        this.arm.pitchObject.rotation.x = localUser.pitch;

        // 4. Update camera distance
        this.camera.position.z = this.arm.currentDistance;
    }
}