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

        // FIX 1: Authority Guard
        // Only spawn if we are the Server OR if we own the entity casting the spell (Prediction)
        // Remote clients should simply wait for the snapshot to spawn the fireball
        const isOwnerLocal = world.has(owner.ownerId, [Comps.Local]);
        if (!world.isServer && !isOwnerLocal) return;
        
        const user = world.get(owner.ownerId, Comps.User);
        const stepId = world.isServer && user ? user.lastProcessedSeq : world.stepCount;

        // Spawn the projectile
        world.spawn({
            type: EntityTypes.fireball,
            components: [
                { type: Comps.Transform, data: { pos: new SolVec3(0, 5, 0) } },
                { type: Comps.Owner, data: { ownerId: owner.ownerId, step: stepId } },
                // Mark predicted entities as Local so we can find/delete them later
                ...(world.isServer ? [] : [{ type: Comps.Local }])
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