import type { SolWorld } from "#/common/core/SolWorld"
import type { MovementComp } from "../MovementComp"

export abstract class MoveState {
    canEnter(world: SolWorld, id: number, move: MovementComp): boolean { return true };
    canExit(world: SolWorld, id: number, move: MovementComp): boolean { return true };
    enter(world: SolWorld, id: number, move: MovementComp): void { };
    exit(world: SolWorld, id: number, move: MovementComp): void { };
    abstract update(world: SolWorld, id: number, dt: number, move: MovementComp): void;
}