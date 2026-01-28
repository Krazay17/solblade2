import type { MovementComp } from "../MovementComp"

export abstract class MoveState {
    canEnter(move: MovementComp): boolean { return true };
    canExit(move: MovementComp): boolean { return true };
    enter(move: MovementComp): void { };
    exit(move: MovementComp): void { };
    abstract update(dt: number, move: MovementComp): void;
}