import type { World } from "@/common/core/World";
import { HardwareInput } from "@/common/systems/input/HardwareInput";
import { PhysicsComp } from "@/common/systems/physics/PhysicsComp";
import type { ISystem } from "@/common/systems/System";
import { CameraArm } from "./CameraArm";
import { SolQuat, SolVec3 } from "@/common/core/SolMath";

export class CameraSystem implements ISystem {
    tempQuat = new SolQuat();
    tempDir = new SolVec3();
    update(world: World, dt: number) {
        const hardware = world.getSingleton(HardwareInput);

        // Find entities that have both a Transform and a CameraArm
        const entities = world.query(PhysicsComp, CameraArm);

        for (const id of entities) {
            const transform = world.get(id, PhysicsComp)!;
            const arm = world.get(id, CameraArm)!;

            // 1. Calculate the Rotation from HardwareInput (Yaw/Pitch)
            // We use the yaw/pitch directly from your InputSystem
            const quat = this.tempQuat.setFromEuler(hardware.pitch, hardware.yaw, 0);

            // 2. Calculate the "Target" (Shoulder) position
            const shoulderPos = {
                x: transform.body!.translation().x + arm.offset.x,
                y: transform.body!.translation().y + arm.offset.y,
                z: transform.body!.translation().z + arm.offset.z
            };

            // 3. Calculate the Camera Direction (Forward vector of the rotation)
            this.tempDir.set(0, 0, -1);
            this.tempDir.applyQuaternion(quat);

            // 4. Set Camera Position (Shoulder - (Direction * Distance))
            const camX = shoulderPos.x - this.tempDir.x * arm.currentDistance;
            const camY = shoulderPos.y - this.tempDir.y * arm.currentDistance;
            const camZ = shoulderPos.z - this.tempDir.z * arm.currentDistance;

            // 5. Update the World Rendering Camera
            // Usually, you'd have a Singleton for the "ActiveCamera"
            world.getSingleton(ActiveCamera).setPosition(camX, camY, camZ);
            world.getSingleton(ActiveCamera).setRotation(quat);
        }
    }
    private applyQuaternion(v: any, q: any) { /* returns Vector3 */ }
}