
import { MovementComp } from "./MovementComp";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";
import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/core/ECS"
import { PhysicsComp } from "../physics/PhysicsComp";
import { SolQuat } from "@/common/core/SolMath";
import type { IMoveState } from "@/common/core/ECS";
import { StatusComp, StatusType } from "../status/StatusComp";

let _tempQuat = new SolQuat();

export class MovementSystem implements ISystem {
    private states: Record<string, IMoveState> = {
        idle: new IdleState(),
        walk: new WalkState(),
    }

    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(PhysicsComp, MovementComp);
        for (const id of ids) {
            const status = world.get(id, StatusComp);
            const phys = world.get(id, PhysicsComp)!;
            const move = world.get(id, MovementComp)!;

            let state = move.state;
            if (status && (status.flags & StatusType.STUN)) {
                state = "idle";
            }
            if (!phys.body) continue;
            move.velocity.copy(phys.body!.linvel());
            if (state !== move.lastState) {
                phys.body.wakeUp();
                this.states[move.lastState].exit(move);
                this.states[state].enter(move);
                move.lastState = state;
            }
            this.states[state].update(dt, move);

            if (move.velocity.length() > 0.001) {
                phys.body.setLinvel(move.velocity, true);
                phys.body.setRotation(SolQuat.applyYaw(_tempQuat, move.yaw), true);
            }
        }
    }
}