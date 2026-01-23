import type { World } from "#/common/core/World";
import type { AbilityState, ISystem } from "#/common/core/ECS"
import { AbilityComp } from "./AbilityComp";
import { Actions } from "#/common/core/SolConstants";
import { FireballState } from "./FireballState";
import { IdleAbilityState } from "./IdleAbilityState";

export class AbilitySystem implements ISystem {
    states: Record<string, AbilityState> = {
        idle: new IdleAbilityState(),
        fireball: new FireballState(),

    };
    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(AbilityComp);
        for (const id of ids) {
            const ability = world.get(id, AbilityComp);

            if (!ability) return;
            if (ability.action === Actions.ABILITY1) ability.requestedState = ability.available[0];
            if (ability.action === Actions.ABILITY2) ability.requestedState = ability.available[1];
            ability.action = Actions.NONE;

            if (ability.requestedState && ability.requestedState !== ability.state) {
                const currentStateObj = this.states[ability.state];
                const nextStateObj = this.states[ability.requestedState];

                if (currentStateObj.canExit(world, id, ability) && nextStateObj.canEnter(world, id, ability)) {
                    currentStateObj.exit(world, id, ability);
                    nextStateObj.enter(world, id, ability);
                    ability.state = ability.requestedState;
                    ability.requestedState = null;
                }
            }
            this.states[ability.state].update(world, id, dt, ability);
        }

    }
}