import { MoveState } from "./MoveState";
import { MovementComp } from "../MovementComp";
import { groundMove } from "../MoveUtils";
import type { SolWorld } from "#/common/core/SolWorld";

export class WalkState extends MoveState {
    update(world: SolWorld, id: number, dt: number, move: MovementComp): void {
        groundMove(dt, move);
        
    }
}