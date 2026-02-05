import { MoveState } from "./MoveState";
import { MovementComp } from "../MovementComp";
import { idleMove } from "../MoveUtils";
import type { SolWorld } from "#/common/core/SolWorld";

export class IdleState extends MoveState {
    update(world: SolWorld, id: number, dt: number, move: MovementComp): void {
        idleMove(dt, move);
    }
}