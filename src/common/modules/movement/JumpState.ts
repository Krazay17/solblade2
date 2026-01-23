import { MoveState } from "#/common/core/ECS";
import type { MovementComp } from "./MovementComp";
import { groundMove, jump } from "./MoveMath";

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