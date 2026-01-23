import { MovementComp } from "./MovementComp";
import { groundMove } from "./MoveMath";
import { Actions } from "@/common/core/SolConstants";
import { MoveState } from "@/common/core/ECS";

export class WalkState extends MoveState {
    update(dt: number, move: MovementComp): void {
        groundMove(dt, move);
    }
}