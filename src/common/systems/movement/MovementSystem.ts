
import { MovementComp } from "./MovementComp";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";
import type { World } from "@/common/core/World";
import type { ISystem } from "../System";

export interface MovementState {
    enter(comp: MovementComp): void;
    exit(comp: MovementComp): void;
    update(comp: MovementComp, dt: number): void;
}

export class MovementSystem implements ISystem {
    private components: MovementComp[] = [];
    private states: Record<string, MovementState> = {
        idle: new IdleState(),
        walk: new WalkState(),
    }

    step(world: World, dt: number): void {
        for (const c of this.components) {
            if (c.state !== c.lastState) {
                this.states[c.lastState].exit(c);
                this.states[c.state].enter(c);
                c.lastState = c.state;
            }
            this.states[c.state].update(c, dt);
        }
    }
}