import { Comps, AbilityState } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import { AbilityComp } from "./AbilityComp";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";

export class FireballState extends AbilityState {
    canEnter(world: World, id: number): boolean {
        return true;
    }
    canExit(world: World, id: number): boolean {
        return true;
    }
    enter(world: World, id: number, ability: AbilityComp): void {
        const owner = world.get(id, Comps.Owner);
        if (!owner) return;

        const user = world.get(owner.ownerId, Comps.User);
        if (!user) return;

        const isOwnerLocal = world.has(owner.ownerId, [Comps.Local]);
        if (!world.isServer && !isOwnerLocal) return;

        const stepId = user.lastProcessedSeq;

        console.log(`[${world.isServer ? 'SERVER' : 'CLIENT'}] Fireball stepId=${stepId}, worldStep=${world.stepCount}, bufferLen=${user.inputBuffer.length}`);


        // Spawn the projectile
        world.spawn({
            type: EntityTypes.fireball,
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(0, 5, 0) } },
                { type: Comps.Owner, data: { ownerId: owner.ownerId, step: stepId } },
            ]
        })

        const move = world.get(id, Comps.Movement);
        ability.duration = 2;
        ability.timer = 0;
        if (move) {
            move.augmentSpeed = 0.33;
        }
    }
    update(world: World, id: number, dt: number, ability: AbilityComp): void {
        ability.timer += dt;
        if (ability.timer >= ability.duration) {
            ability.requestedState = "idle";
        }
    }
}