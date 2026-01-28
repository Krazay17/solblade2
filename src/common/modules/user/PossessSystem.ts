import { type World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { PhysicsComp } from "#/common/modules";
import RAPIER from "@dimforge/rapier3d-compat";
import { UserComp } from "#/common/modules/user/UserComp";
import { bodyPhysChange } from "#/common/core/PhysicsFactory";

export class PossessSystem implements ISystem {
    preStep(world: World): void {
        for (const id of world.query(UserComp)) {
            const user = world.get(id, UserComp)!;

            if (user.pendingPawnId === null ||
                user.pendingPawnId === user.pawnId)
                continue;

            const newPawnId = user.pendingPawnId;
            const oldPawnId = user.pawnId;
            const controlled = world.has(newPawnId, UserComp);
            if(controlled)continue;

            if (!world.isServer) {
                if (oldPawnId) {
                    const phys = world.get(oldPawnId, PhysicsComp);
                    phys?.body?.setBodyType(
                        RAPIER.RigidBodyType.KinematicPositionBased,
                        true
                    );
                    world.removeComponent(oldPawnId, UserComp);
                }
                const phys = world.get(newPawnId, PhysicsComp);
                if (phys && phys.body) {
                    bodyPhysChange(phys, true);
                    phys.body.sleep();
                    phys.body.wakeUp();
                }
            }
            user.pawnId = newPawnId;
            user.pendingPawnId = null;
        }
    }
}