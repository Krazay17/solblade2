
import { MovementComp } from "./MovementComp";
import { WalkState } from "./states/WalkState";
import { IdleState } from "./states/IdleState";
import type { SolWorld } from "#/common/core/SolWorld";
import { Comps, type ISystem } from "#/common/core/ECS"
import { SolQuat } from "#/common/core/SolMath";
import type { MoveState } from "./states/MoveState";
import { StatusType } from "../status/StatusComp";
import { JumpState } from "./states/JumpState";
import { FallState } from "./states/FallState";
import { DevFlyState } from "./states/DevFlyState";

let _tempQuat = new SolQuat();

export class MovementSystem implements ISystem {
    private states: Record<string, MoveState> = {
        idle: new IdleState(),
        walk: new WalkState(),
        jump: new JumpState(),
        fall: new FallState(),
        devFly: new DevFlyState(),
    }

    preStep(world: SolWorld, dt: number, time: number): void {
        const ids = world.query([Comps.Movement, Comps.Physics]);
        for (const id of ids) {
            this.process(world, id, dt, time);
        }
    }

    process(world: SolWorld, id: number, dt: number, time: number): void {
        const phys = world.get(id, Comps.Physics)!;
        const move = world.get(id, Comps.Movement)!;
        const status = world.get(id, Comps.Status);

        if (!phys.body) return;
        move.velocity.copy(phys.body!.linvel());
        let intent = this.getIntentState(move);

        if (status && status.flags & StatusType.STUN) {
            intent = "idle";
        }

        move.state = this.switchState(world, id, move.state, intent, move);
        this.states[move.state].update(world, id, dt, move);

        phys.body.setLinvel(move.velocity, true);
        phys.body.setRotation(SolQuat.applyYaw(_tempQuat, move.yaw), true);
    }

    getIntentState(move: MovementComp): string {
        if (move.devFly) {
            return "devFly"
        }
        if (move.wantsJump) {
            move.wantsJump = false;
            return "jump";
        }
        if (move.wishdir.length() > 0) {
            return "walk";
        }
        return "idle";
    }

    switchState(world: SolWorld, id: number, from: string, to: string, move: MovementComp): string {
        if (to && to !== from) {
            if (!this.states[from].canExit(world, id, move)) return from;
            if (!this.states[to].canEnter(world, id, move)) return from;

            this.states[from].exit(world, id, move);
            this.states[to].enter(world, id, move);
            return to;
        }
        return from;
    }

}