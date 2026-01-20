import type { World } from "@/common/core/World";
import type { IAbilityState, ISystem } from "@/common/core/ECS"
import { AbilityComp } from "./AbilityComp";

export class AbilitySystem implements ISystem {
    states: Record<string, IAbilityState> = {

    };
    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(AbilityComp);
        for (const id of ids) {
            const ability = world.get(id, AbilityComp);
            if (!ability) return;
            if (ability.state !== ability.lastState) {
                this.states[ability.lastState].exit(ability);
                this.states[ability.state].enter(ability);
                ability.lastState = ability.state;
            }
            this.states[ability.state].update(dt, ability);
        }

    }
}