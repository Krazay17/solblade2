import type { Actor } from "@/common/core/Actor";
import type { MovementState } from "./MovementSystem";
import type { MovementComp } from "@/common/systems/movement/MovementComp";
import { move } from "./MoveMath";

export class WalkState implements MovementState {
    enter(comp: MovementComp): void {

    }
    exit(comp: MovementComp): void {

    }
    update(comp: MovementComp, dt: number): void {
        //move(dt, comp);
    }
}