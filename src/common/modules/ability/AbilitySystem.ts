import type { World } from "@/common/core/World";
import type { IAbilityState, ISystem } from "@/common/core/ECS"
import { AbilityComp } from "./AbilityComp";
import { Actions } from "@/common/core/SolConstants";
import { FireballState } from "./FireballState";
import { IdleAbilityState } from "./IdleAbilityState";

export class AbilitySystem implements ISystem {
    states: Record<string, IAbilityState> = {
        idle: new IdleAbilityState(),
        fireball: new FireballState(),

    };
    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(AbilityComp);
        for (const id of ids) {
            const ability = world.get(id, AbilityComp);

            if (!ability) return;
            let requestedState: string | null = null;
            if (ability.action === Actions.ABILITY1) requestedState = ability.available[0];
            if (ability.action === Actions.ABILITY2) requestedState = ability.available[1];

            if (requestedState && requestedState !== ability.state) {
                const currentStateObj = this.states[ability.state];
                const nextStateObj = this.states[requestedState];

                if (currentStateObj.canExit(ability) && nextStateObj.canEnter(ability)) {
                    currentStateObj.exit(ability);
                    nextStateObj.enter(ability);
                    ability.state = requestedState;
                }
            }
            this.states[ability.state].update(dt, ability);
        }

    }
}