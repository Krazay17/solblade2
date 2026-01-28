
import { MovementComp } from "./MovementComp";
import { WalkState } from "./states/WalkState";
import { IdleState } from "./states/IdleState";
import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { PhysicsComp } from "../physics/PhysicsComp";
import { SolQuat } from "#/common/core/SolMath";
import type { MoveState } from "./states/MoveState";
import { StatusComp, StatusType } from "../status/StatusComp";
import { JumpState } from "./states/JumpState";
import { UserComp } from "../user/UserComp";

let _tempQuat = new SolQuat();

export class MovementSystem implements ISystem {
    private states: Record<string, MoveState> = {
        idle: new IdleState(),
        walk: new WalkState(),
        jump: new JumpState(),
    }

    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(PhysicsComp, MovementComp);
        for (const id of ids) {
            const phys = world.get(id, PhysicsComp)!;
            const move = world.get(id, MovementComp)!;
            const status = world.get(id, StatusComp);

            if (!phys.body) continue;
            move.velocity.copy(phys.body!.linvel());
            let intent = this.getIntentState(move);

            if (status && status.flags & StatusType.STUN) {
                intent = "idle";
            }

            move.state = this.switchState(move.state, intent, move);
            this.states[move.state].update(dt, move);

            if (move.velocity.lengthSq() > 0.000001) {
            }
            phys.body.setLinvel(move.velocity, true);
            phys.body.setRotation(SolQuat.applyYaw(_tempQuat, move.yaw), true);
        }
    }

    getIntentState(move: MovementComp): string {
        if (move.wantsJump) {
            move.wantsJump = false;
            return "jump";
        }
        if (move.wishdir.length() > 0) {
            return "walk";
        }
        return "idle";
    }

    switchState(from: string, to: string, move: MovementComp): string {
        if (to && to !== from) {
            if (!this.states[from].canExit(move)) return from;
            if (!this.states[to].canEnter(move)) return from;

            this.states[from].exit(move);
            this.states[to].enter(move);
            return to;
        }
        return from;
    }

}