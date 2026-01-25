import type { ISystem } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import { PhysicsComp } from "../physics/PhysicsComp";
import { TransformComp } from "./TransformComp";

export class TransformSystem implements ISystem {
    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(TransformComp);
        for (const id of ids) {
            const xform = world.get(id, TransformComp)!;
            xform.lastPos.copy(xform.pos);
            xform.lastQuat.copy(xform.quat);
        }
    }
    postStep(world: World, dt: number, time: number): void {
        const ids = world.query(TransformComp);
        for (const id of ids) {
            const xform = world.get(id, TransformComp)!;
            const phys = world.get(id, PhysicsComp);

            if (phys && phys.body) {
                xform.pos.copy(phys.body.translation());
                xform.quat.copy(phys.body.rotation());
            }
        }
    }
}