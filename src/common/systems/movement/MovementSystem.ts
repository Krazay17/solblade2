import type { Actor } from "@/common/core/Actor";
import type { MovementComp } from "./MovementComp";
import { System } from "../System";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";

export interface MovementState {
    enter(actor: Actor, comp: MovementComp): void;
    exit(actor: Actor, comp: MovementComp): void;
    update(dt: number, actor: Actor, comp: MovementComp): void;
}

export class MovementSystem extends System<MovementComp> {
    public lookup: string = "MovementComp";
    private states: Record<string, MovementState> = {
        idle: new IdleState(),
        walk: new WalkState(),
    }
    update(dt: number, time: number): void {
        for (const [actor, comp] of this.actors) {
            if (comp.state !== comp.lastState) {
                this.states[comp.lastState].exit(actor, comp);
                this.states[comp.state].enter(actor, comp);
                comp.lastState = comp.state;
            }
            this.states[comp.state].update(dt, actor, comp);
        }
    }
}