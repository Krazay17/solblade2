import { Comps, AbilityState } from "#/common/core/ECS";
import type { SolWorld } from "#/common/core/SolWorld";
import { AbilityComp } from "./AbilityComp";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";

export class FireballState extends AbilityState {
    canEnter(world: SolWorld, id: number): boolean {
        return true;
    }
    canExit(world: SolWorld, id: number): boolean {
        return true;
    }
    enter(world: SolWorld, id: number, ability: AbilityComp): void {
        ability.timer = 0;
        ability.duration = 1;
        const move = world.get(id, Comps.Movement);
        const xform = world.get(id, Comps.Transform);
        if (!move || !xform) return;


        const owner = world.get(id, Comps.Owner);
        if (!owner) return;
        const user = world.get(owner.ownerId, Comps.User);
        if (!user) return;
        const isOwnerLocal = world.has(owner.ownerId, [Comps.Authority]);
        if (!world.isServer && !isOwnerLocal) return;

        const stepId = user.lastProcessedSeq;
        const vel = move.getAim().multiplyScalar(25);
        const pos = move.getAimPos(xform.pos);
        move.augmentSpeed = 0.33;

        console.log(stepId);

        world.spawn({
            type: EntityTypes.fireball,
            components: [
                { type: Comps.Transform, data: { pos: pos } },
                { type: Comps.Owner, data: { ownerId: owner.ownerId, step: stepId } },
                { type: Comps.Physics, data: { velocity: vel } }
            ]
        })

    }
    update(world: SolWorld, id: number, dt: number, ability: AbilityComp): void {
        ability.timer += dt;
        if (ability.timer >= ability.duration) {
            ability.requestedState = "idle";
        }
    }
}