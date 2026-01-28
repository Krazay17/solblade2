import { MoveState } from "./MoveState";
import { MovementComp } from "../MovementComp";
import { groundMove } from "../MoveUtils";

export class WalkState extends MoveState {
    update(dt: number, move: MovementComp): void {
        groundMove(dt, move);
    }
}