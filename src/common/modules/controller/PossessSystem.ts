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

            if (user.changePawn === null) continue;

            // 1. Get all pawns that are NOT owned by someone else
            const candidates = world.query([Comps.Movement]).filter(pawnId => {
                if (pawnId === user.pawnId) return true; // Keep current pawn in list to allow offset math
                return !world.has(pawnId, [Comps.Owner]); // Skip if already possessed
            });

            if (candidates.length <= 1 && user.pawnId) {
                user.changePawn = null; // Nowhere to go
                continue;
            }

            const currentIdx = candidates.indexOf(user.pawnId ?? -1);
            const newIdx = (currentIdx + user.changePawn + candidates.length) % candidates.length;
            const targetId = candidates[newIdx];

            user.changePawn = null;
            if (targetId === user.pawnId) continue;

            const oldPawnId = user.pawnId;
            if (oldPawnId) {
                const remote = world.getComp(oldPawnId, Comps.Remote);
                if (!world.isServer) {
                    const phys = world.getComp(oldPawnId, Comps.Physics);
                    phys?.body?.setBodyType(
                        RAPIER.RigidBodyType.KinematicPositionBased,
                        true
                    );
                }
                world.removeComponent(oldPawnId, OwnerComp);
            }
            const phys = world.getComp(targetId, Comps.Physics);
            if (phys && phys.body) {
                bodyPhysChange(phys, true);
                phys.body.sleep();
                phys.body.wakeUp();
            }
            user.pawnId = targetId;
            world.add(targetId, Comps.Owner).setOwnerId(user.entityId).setStep(user.lastProcessedSeq);
        }
    }
}