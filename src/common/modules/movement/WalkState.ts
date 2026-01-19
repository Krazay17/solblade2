import type { MovementState } from "./MovementSystem";
import type { MovementComp } from "./MovementComp";
import { jump, move } from "./MoveMath";
import { Actions } from "@/common/core/SolConstants";

export class WalkState implements MovementState {
    enter(comp: MovementComp): void {

    }
    exit(comp: MovementComp): void {

    }
    update(comp: MovementComp, dt: number): void {
        move(dt, comp);
        if (comp.actionMap.get(Actions.JUMP)) {
            jump(dt, comp);
        }
    }
}