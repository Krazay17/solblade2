import type { Actor } from "@/common/core/Actor";
import type { MovementState } from "./MovementSystem";
import type { MovementComp } from "@/common/systems/movement/MovementComp";

export class IdleState implements MovementState {
    enter(actor: Actor, comp: MovementComp): void {

    }
    exit(actor: Actor, comp: MovementComp): void {

    }
    update(dt: number, actor: Actor, comp: MovementComp): void {
        if (actor.movement!.inputs.moveDir.x !== 0 ||
            actor.movement!.inputs.moveDir.z !== 0
        )
            actor.movement!.state = "walk";
    }
}