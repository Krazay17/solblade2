import { Comps, AbilityState } from "#/common/core/ECS";
import type { SolWorld } from "#/common/core/SolWorld";
import { AbilityComp } from "./AbilityComp";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";

export class FireballState extends AbilityState {
    canEnter(world: SolWorld, id: number): boolean {
        return true;
    }
    canExit(world: SolWorld, id: number): boolean {
        return true;
    }
    enter(world: SolWorld, id: number, ability: AbilityComp): void {
        ability.timer = 0;
        ability.duration = .5;
        const move = world.get(id, Comps.Movement);
        const xform = world.get(id, Comps.Transform);
        if (!move || !xform) return;

        move.augmentSpeed = 0;

        const remote = world.get(id, Comps.Remote);
        if(remote)return;
        const owner = world.get(id, Comps.Owner);
        if (!owner) return;
        //if(!world.get(id, Comps.Authority))return
        const user = world.get(owner.ownerId, Comps.User);
        const stepId = user ? user.lastProcessedSeq : world.stepCount
        const pos = move.getAimPos(xform.pos);
        const vel = move.getAim().multiplyScalar(25);
        world.spawn({
            type: EntityTypes.fireball,
            role: world.getRole(id),
            components: [
                { type: Comps.Transform, data: { pos: pos } },
                { type: Comps.Owner, data: { ownerId: owner.ownerId, iid: stepId } },
                { type: Comps.Physics, data: { velocity: vel } }
            ]
        })
        console.log(stepId);
    }
    update(world: SolWorld, id: number, dt: number, ability: AbilityComp): void {
        ability.timer += dt;
        if (ability.timer >= ability.duration) {
            ability.requestedState = "idle";
        }
    }
}