import type { IAbilityState } from "@/common/core/ECS";
import type { AbilityComp } from "./AbilityComp";

export class FireballState implements IAbilityState {
    canEnter(comp: AbilityComp): boolean {
        return true;
    }
    canExit(comp: AbilityComp): boolean {
        return true;
    }
    enter(comp: AbilityComp): void {
        console.log("fireball!");
    }
    exit(comp: AbilityComp): void {
        
    }
    update(dt: number, comp: AbilityComp): void {
        
    }
}