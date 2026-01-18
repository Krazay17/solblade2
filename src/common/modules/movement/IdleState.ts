import type { MovementState } from "./MovementSystem";
import type { MovementComp } from "./MovementComp";

export class IdleState implements MovementState {
    enter(comp: MovementComp): void {

    }
    exit(comp: MovementComp): void {

    }
    update(comp: MovementComp, dt: number): void {
        if (comp.inputs.moveDir.x !== 0 ||
            comp.inputs.moveDir.z !== 0
        )
            comp.state = "walk";
    }
}