import type { IAbilityState } from "@/common/core/ECS";
import type { World } from "@/common/core/World";

export class IdleAbilityState implements IAbilityState {
    canEnter(world: World, id: number): boolean {
        return true;
    }
    canExit(world: World, id: number): boolean {
        return true;
    }
    enter(world: World, id: number): void {
        
    }
    exit(world: World, id: number): void {
        
    }
    update(world: World, id: number, dt: number): void {
        
    }
}