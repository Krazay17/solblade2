
import { MovementComp } from "./MovementComp";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";
import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { PhysicsComp } from "../physics/PhysicsComp";
import { SolQuat, SolVec3 } from "#/common/core/SolMath";
import type { MoveState } from "#/common/core/ECS";
import { StatusComp, StatusType } from "../status/StatusComp";
import { JumpState } from "./JumpState";
import { Actions } from "#/common/core/SolConstants";

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

            calcDir(move, move.wishdir);
            let intent = this.getIntent(move);

            if(status && status.flags & StatusType.STUN){
                intent = "idle";
            }
            move.state = this.switchState(move.state, intent, move);
            this.states[move.state].update(dt, move);

            if (move.velocity.lengthSq() > 0.000001) {
                phys.body.setLinvel(move.velocity, true);
                phys.body.setRotation(SolQuat.applyYaw(_tempQuat, move.yaw), true);
            }
        }
    }

    getIntent(move: MovementComp): string {
        if (!move.isGrounded) {
            return "fall";
        }
        if (move.actions.justPressed.has(Actions.JUMP)) {
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

function calcDir(comp: MovementComp, wishdir: SolVec3) {
    wishdir.set(0, 0, 0);

    const fwd = comp.actions.held.has(Actions.FWD) ? 1 : 0;
    const bwd = comp.actions.held.has(Actions.BWD) ? 1 : 0;
    const left = comp.actions.held.has(Actions.LEFT) ? 1 : 0;
    const right = comp.actions.held.has(Actions.RIGHT) ? 1 : 0;

    const zInput = bwd - fwd;   // -1 is Forward
    const xInput = right - left; // 1 is Right

    if (zInput === 0 && xInput === 0) return wishdir;

    // 3. Rotate Direction by Yaw
    // We use Math.sin/cos to rotate our vector manually - it's faster and simpler
    const sin = Math.sin(comp.yaw);
    const cos = Math.cos(comp.yaw);

    // Standard 2D rotation formula applied to X and Z
    const worldX = xInput * cos + zInput * sin;
    const worldZ = zInput * cos - xInput * sin;

    wishdir.set(worldX, 0, worldZ).normalize();
    return wishdir;
}