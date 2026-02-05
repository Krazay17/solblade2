import { MoveState } from "./MoveState";
import { MovementComp } from "../MovementComp";
import type { SolWorld } from "#/common/core/SolWorld";

export class FallState extends MoveState {
    update(world: SolWorld, id: number, dt: number, move: MovementComp): void {
        
    }
}