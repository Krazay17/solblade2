import type { IAbilityState } from "@/common/core/ECS";
import type { World } from "@/common/core/World";
import { applyStun } from "../status/StatusSystem";

export class FireballState implements IAbilityState {
    canEnter(world: World, id: number): boolean {
        return true;
    }
    canExit(world: World, id: number): boolean {
        return true;
    }
    enter(world: World, id: number): void {
        console.log("fireball!");
        
        applyStun(world, id, 5);
    }
    exit(world: World, id: number): void {
        
    }
    update(world: World, id: number, dt: number): void {
        
    }
}