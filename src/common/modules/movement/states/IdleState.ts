import { MoveState } from "./MoveState";
import { MovementComp } from "../MovementComp";

export class IdleState extends MoveState {
    update(dt: number, move: MovementComp): void {
    }
}