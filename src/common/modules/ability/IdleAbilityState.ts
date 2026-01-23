import { AbilityState } from "@/common/core/ECS";
import type { World } from "@/common/core/World";
import { MovementComp } from "../movement/MovementComp";

export class IdleAbilityState extends AbilityState {
    canEnter(world: World, id: number): boolean {
        return true;
    }
    canExit(world: World, id: number): boolean {
        return true;
    }
    enter(world: World, id: number): void {
        const move = world.get(id, MovementComp);
        if (move) move.augmentSpeed = 1;
    }
}