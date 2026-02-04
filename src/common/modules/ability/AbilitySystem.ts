import type { SolWorld } from "#/common/core/SolWorld";
import { Comps, type AbilityState, type ISystem } from "#/common/core/ECS"
import { Actions } from "#/common/core/SolConstants";
import { FireballState } from "./FireballState";
import { IdleAbilityState } from "./IdleAbilityState";

export class AbilitySystem implements ISystem {
    states: Record<string, AbilityState> = {
        idle: new IdleAbilityState(),
        fireball: new FireballState(),
    };
    preStep(world: SolWorld, dt: number, time: number): void {
        const ids = world.query([Comps.Ability]);
        for (const id of ids) {
            this.process(world, id, dt, time);
        }
    }
    process(world: SolWorld, id: number, dt: number, time: number): void {
        const ability = world.get(id, Comps.Ability);
        if (!ability) return;
        let state;
        if (ability.action === Actions.ABILITY2) state = ability.available[1];
        if (ability.action === Actions.ABILITY1) state = ability.available[0];
        ability.action = Actions.NONE;
        
        const prevState = ability.state;
        if (ability.requestedState) state = ability.requestedState;
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