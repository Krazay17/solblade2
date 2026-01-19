
import { MovementComp } from "./MovementComp";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";
import type { World } from "@/common/core/World";
import type { ISystem } from "../System";
import { PhysicsComp } from "../components/PhysicsComp";

export interface MovementState {
    enter(comp: MovementComp): void;
    exit(comp: MovementComp): void;
    update(comp: MovementComp, dt: number): void;
}

export class MovementSystem implements ISystem {
    //private components: MovementComp[] = [];
    private states: Record<string, MovementState> = {
        idle: new IdleState(),
        walk: new WalkState(),
    }

    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(PhysicsComp, MovementComp);
        for (const id of ids) {
            const phys = world.get(id, PhysicsComp)!;
            const move = world.get(id, MovementComp)!;
            if(!phys.body)return;
            move.velocity.copy(phys.body!.linvel());
            if (move.state !== move.lastState) {
                this.states[move.lastState].exit(move);
                this.states[move.state].enter(move);
                move.lastState = move.state;
            }
            this.states[move.state].update(move, dt);
            phys.body!.setLinvel(move.velocity, true);
        }
        // for (const c of this.components) {
        //     if (c.state !== c.lastState) {
        //         this.states[c.lastState].exit(c);
        //         this.states[c.state].enter(c);
        //         c.lastState = c.state;
        //     }
        //     this.states[c.state].update(c, dt);
        // }

    }
}