import { Actions } from "@/common/core/SolConstants";
import { jump } from "./MoveMath";
import type { IMoveState } from "@/common/core/ECS";
import { MovementComp } from "./MovementComp";

export class IdleState implements IMoveState {
    enter(comp: MovementComp): void {

    }
    exit(comp: MovementComp): void {

    }
    update(dt: number, comp: MovementComp): void {
        if (!comp) return;
        if (comp.hasMovementInput())
            comp.state = "walk";
        if (comp.actionMap.get(Actions.JUMP)) {
            jump(dt, comp);
        }
    }
}