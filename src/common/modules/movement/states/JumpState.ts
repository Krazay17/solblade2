import { MoveState } from "./MoveState";
import { MovementComp } from "../MovementComp";
import { groundMove, jump } from "../MoveUtils";

export class JumpState extends MoveState {
    enter(move: MovementComp): void {
        move.jumpTimer = 0;
        jump(move);
    }
    update(dt: number, move: MovementComp): void {
        move.jumpTimer += dt;
        if (move.jumpTimer >= move.jumpDuration)
            move.state = "idle";

        groundMove(dt, move);
    }
}