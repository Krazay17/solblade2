import type { MovementState } from "./MovementSystem";
import type { MovementComp } from "./MovementComp";
import { Actions } from "@/common/core/SolConstants";
import { jump } from "./MoveMath";

export class IdleState implements MovementState {
    enter(comp: MovementComp): void {

    }
    exit(comp: MovementComp): void {

    }
    update(comp: MovementComp, dt: number): void {
        if (comp.hasMovementInput())
            comp.state = "walk";
        if(comp.actionMap.get(Actions.JUMP)){
            jump(dt, comp);
        }
    }
}