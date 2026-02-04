import { AbilityState, Comps } from "#/common/core/ECS";
import type { SolWorld } from "#/common/core/SolWorld";

export class IdleAbilityState extends AbilityState {
    canEnter(world: SolWorld, id: number): boolean {
        return true;
    }
    canExit(world: SolWorld, id: number): boolean {
        return true;
    }
    enter(world: SolWorld, id: number): void {
        const move = world.get(id, Comps.Movement);
        if (move) move.augmentSpeed = 1;
    }
}