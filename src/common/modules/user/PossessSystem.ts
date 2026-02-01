import { type World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import RAPIER from "@dimforge/rapier3d-compat";
import { bodyPhysChange } from "#/common/core/PhysicsFactory";
import { OwnerComp } from "./OwnerComp";
import { Comps } from "#/common/core/ECSRegi";

export class PossessSystem implements ISystem {
    preStep(world: World): void {
        for (const id of world.query([Comps.User])) {
            const user = world.getComp(id, Comps.User)!;

            if (user.pendingPawnId === null ||
                user.pendingPawnId === user.pawnId)
                continue;

            const newPawnId = user.pendingPawnId;
            const oldPawnId = user.pawnId;
            const isUser = world.has(newPawnId, [Comps.User]);
            const controlled = world.has(newPawnId, [Comps.Owner]);
            if (isUser || controlled) {
                user.pendingPawnId = null;
                continue;
            }
            
            if (oldPawnId) {
                const remote = world.getComp(oldPawnId, Comps.Remote);
                if (remote) {
                    const phys = world.getComp(oldPawnId, Comps.Physics);
                    phys?.body?.setBodyType(
                        RAPIER.RigidBodyType.KinematicPositionBased,
                        true
                    );
                }
                world.removeComponent(oldPawnId, OwnerComp);
            }
            const phys = world.getComp(newPawnId, Comps.Physics);
            if (phys && phys.body) {
                bodyPhysChange(phys, true);
                phys.body.sleep();
                phys.body.wakeUp();
            }
            user.pawnId = newPawnId;
            user.pendingPawnId = null;
            world.add(user.pawnId, Comps.Owner).setOwnerId(user.entityId).setStep(user.lastProcessedSeq);
        }
    }
}