import { type SolWorld } from "#/common/core/SolWorld";
import  {Comps, type ISystem } from "#/common/core/ECS"

export class PossessSystem implements ISystem {
    preStep(world: SolWorld): void {
        if (!world.isServer) return; // Server only

        for (const id of world.query([Comps.User])) {
            const user = world.get(id, Comps.User)!;
            if (user.changePawn === null) continue;

            const candidates = world.query([Comps.Movement])
                .filter(pawnId => pawnId === user.pawnId || !world.has(pawnId, [Comps.Owner]));

            if (candidates.length <= 1) {
                user.changePawn = null;
                continue;
            }

            const currentIdx = candidates.indexOf(user.pawnId ?? -1);
            const newIdx = (currentIdx + user.changePawn + candidates.length) % candidates.length;
            const targetId = candidates[newIdx];

            user.changePawn = null;
            if (targetId === user.pawnId) continue;

            // Release old
            if (user.pawnId) {
                world.removeComponent(user.pawnId, Comps.Owner);
            }

            // Possess new
            user.pawnId = targetId;
            world.add(targetId, Comps.Owner, { ownerId: user.entityId });
        }
    }
}