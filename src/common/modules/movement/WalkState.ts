import type { MovementState } from "./MovementSystem";
import type { MovementComp } from "./MovementComp";
import { move } from "./MoveMath";

export class WalkState implements MovementState {
    enter(comp: MovementComp): void {

    }
    exit(comp: MovementComp): void {

    }
    update(comp: MovementComp, dt: number): void {
        //move(dt, comp);
    }
}