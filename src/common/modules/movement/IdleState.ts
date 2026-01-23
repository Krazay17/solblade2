import { MoveState } from "#/common/core/ECS";
import { MovementComp } from "./MovementComp";

export class IdleState extends MoveState {
    update(dt: number, move: MovementComp): void {
    }
}