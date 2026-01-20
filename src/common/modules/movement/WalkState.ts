import { MovementComp } from "./MovementComp";
import { jump, move } from "./MoveMath";
import { Actions } from "@/common/core/SolConstants";
import type { IMoveState } from "@/common/core/ECS";

export class WalkState implements IMoveState {
    enter(comp: MovementComp): void {

    }
    exit(comp: MovementComp): void {

    }
    update(dt: number, comp: MovementComp): void {
        if (!comp) return;
        move(dt, comp);
        if (comp.actionMap.get(Actions.JUMP)) {
            jump(dt, comp);
        }
    }
}