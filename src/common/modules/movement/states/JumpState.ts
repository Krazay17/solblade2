import { MoveState } from "./MoveState";
import { MovementComp } from "../MovementComp";
import { groundMove, jump } from "../MoveUtils";
import type { SolWorld } from "#/common/core/SolWorld";

export class JumpState extends MoveState {
    
    enter(world: SolWorld, id: number, move: MovementComp): void {
        
    
        move.jumpTimer = 0;
        jump(move);
    }
    update(world: SolWorld, id: number, dt: number, move: MovementComp): void {
        
    
        move.jumpTimer += dt;
        if (move.jumpTimer >= move.jumpDuration)
            move.state = "idle";

        groundMove(dt, move);
    }
}