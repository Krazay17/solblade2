import type { World } from "#/common/core/World";
import type { AbilityState, ISystem } from "#/common/core/ECS"
import { Actions } from "#/common/core/SolConstants";
import { FireballState } from "./FireballState";
import { IdleAbilityState } from "./IdleAbilityState";
import { Comps } from "#/common/core/ECSRegi";

export class AbilitySystem implements ISystem {
    states: Record<string, AbilityState> = {
        idle: new IdleAbilityState(),
        fireball: new FireballState(),

    };
    preStep(world: World, dt: number, time: number): void {
        const ids = world.query([Comps.Ability]);
        for (const id of ids) {
            const ability = world.getComp(id, Comps.Ability);
            if (!ability) return;
            if (ability.action === Actions.ABILITY1) ability.requestedState = ability.available[0];
            if (ability.action === Actions.ABILITY2) ability.requestedState = ability.available[1];
            ability.action = Actions.NONE;
            const prevState = ability.state;
            const state = ability.requestedState;
            if (state && state !== prevState) {
                const currentStateObj = this.states[prevState];
                const nextStateObj = this.states[state];

                if (currentStateObj.canExit(world, id, ability) && nextStateObj.canEnter(world, id, ability)) {
                    currentStateObj.exit(world, id, ability);
                    nextStateObj.enter(world, id, ability);
                    ability.state = state;
                    ability.requestedState = null;
                }
            }
            this.states[ability.state].update(world, id, dt, ability);
        }

    }
}