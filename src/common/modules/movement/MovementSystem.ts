
import { MovementComp } from "./MovementComp";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";
import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/core/ECS"
import { PhysicsComp } from "../physics/PhysicsComp";
import { SolQuat } from "@/common/core/SolMath";
import type { IMoveState } from "@/common/core/ECS";

let _tempQuat = new SolQuat();

export class MovementSystem implements ISystem {
    private states: Record<string, IMoveState> = {
        idle: new IdleState(),
        walk: new WalkState(),
    }

    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(PhysicsComp, MovementComp);
        for (const id of ids) {
            const phys = world.get(id, PhysicsComp)!;
            const move = world.get(id, MovementComp)!;
            if (!phys.body) return;
            move.velocity.copy(phys.body!.linvel());
            if (move.state !== move.lastState) {
                phys.body.wakeUp();
                this.states[move.lastState].exit(move);
                this.states[move.state].enter(move);
                move.lastState = move.state;
            }
            this.states[move.state].update(dt, move);

            if (move.velocity.length() > 0.001) {
                phys.body.setLinvel(move.velocity, true);
                phys.body.setRotation(SolQuat.applyYaw(_tempQuat, move.yaw), true);
            }
        }
    }
}