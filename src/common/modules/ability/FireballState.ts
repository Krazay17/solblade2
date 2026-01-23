import { AbilityState } from "@/common/core/ECS";
import type { World } from "@/common/core/World";
import { AbilityComp } from "./AbilityComp";
import { MovementComp } from "../movement/MovementComp";

export class FireballState extends AbilityState {
    canEnter(world: World, id: number): boolean {
        return true;
    }
    canExit(world: World, id: number): boolean {
        return true;
    }
    enter(world: World, id: number, ability: AbilityComp): void {
        const move = world.get(id, MovementComp);

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