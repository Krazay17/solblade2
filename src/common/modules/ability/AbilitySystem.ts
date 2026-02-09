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

        let nextState = ability.requestedState || ability.state;
        if (ability.state === "idle") {
            if (ability.action === Actions.ABILITY1) nextState = ability.available[0];
            if (ability.action === Actions.ABILITY2) nextState = ability.available[1];
        }
        ability.action = Actions.NONE;
        if (nextState && nextState !== ability.state) {
            const currentStateObj = this.states[ability.state];
            const nextStateObj = this.states[nextState];

            if (currentStateObj.canExit(world, id, ability) && nextStateObj.canEnter(world, id, ability)) {
                currentStateObj.exit(world, id, ability);
                nextStateObj.enter(world, id, ability);
                ability.state = nextState;
                ability.requestedState = null;
            }
        }
        this.states[ability.state].update(world, id, dt, ability);
    }
}