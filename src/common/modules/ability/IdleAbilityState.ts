import { AbilityState, Comps } from "#/common/core/ECS";
import type { World } from "#/common/core/World";

export class IdleAbilityState extends AbilityState {
    canEnter(world: World, id: number): boolean {
        return true;
    }
    canExit(world: World, id: number): boolean {
        return true;
    }
    enter(world: World, id: number): void {
        const move = world.get(id, Comps.Movement);
        if (move) move.augmentSpeed = 1;
    }
}