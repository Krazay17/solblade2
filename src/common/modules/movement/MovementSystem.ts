
import { MovementComp } from "./MovementComp";
import { WalkState } from "./WalkState";
import { IdleState } from "./IdleState";
import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/core/ECS"
import { PhysicsComp } from "../physics/PhysicsComp";
import { SolQuat, SolVec3 } from "@/common/core/SolMath";
import type { MoveState } from "@/common/core/ECS";
import { StatusComp, StatusType } from "../status/StatusComp";
import { JumpState } from "./JumpState";
import { Actions } from "@/common/core/SolConstants";


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
            const intent = this.getIntent(move);
            const status = world.get(id, StatusComp);
            const currentState = this.states[move.state];

            if (!phys.body) continue;
            move.velocity.copy(phys.body!.linvel());

            let nextState = (status && status.flags & StatusType.STUN)
                ? "idle"
                : this.switchState();

            this.states[move.state].update(dt, move);

            if (move.velocity.length() > 0.0001) {
                phys.body.setLinvel(move.velocity, true);
                phys.body.setRotation(SolQuat.applyYaw(_tempQuat, move.yaw), true);
            }
        }
    }

    getIntent(move: MovementComp) {
        return {
            dir: calcDir(move),
            desireJump: move.actions.justPressed.has(Actions.JUMP),
        }
    }

    switchState(state: string, move: MovementComp): string {
        let newState;
        if (move.hasMovementInput()) newState = "walk";
        if (move.actions.justPressed.has(Actions.JUMP)) newState = "jump";
        if (newState && newState !== state) {
            if (!this.states[state].canExit(move)) return state;
            if (!this.states[newState].canEnter(move)) return state;

            this.states[state].exit(move);
            this.states[newState].enter(move);
            return newState;
        }
        return state;
    }

}

let _tempDir = new SolVec3();
function calcDir(comp: MovementComp) {
    _tempDir.set(0, 0, 0);

    const fwd = comp.actions.held.has(Actions.FWD) ? 1 : 0;
    const bwd = comp.actions.held.has(Actions.BWD) ? 1 : 0;
    const left = comp.actions.held.has(Actions.LEFT) ? 1 : 0;
    const right = comp.actions.held.has(Actions.RIGHT) ? 1 : 0;

    const zInput = bwd - fwd;   // -1 is Forward
    const xInput = right - left; // 1 is Right

    if (zInput === 0 && xInput === 0) return _tempDir;

    // 3. Rotate Direction by Yaw
    // We use Math.sin/cos to rotate our vector manually - it's faster and simpler
    const sin = Math.sin(comp.yaw);
    const cos = Math.cos(comp.yaw);

    // Standard 2D rotation formula applied to X and Z
    const worldX = xInput * cos + zInput * sin;
    const worldZ = zInput * cos - xInput * sin;

    _tempDir.set(worldX, 0, worldZ).normalize();

    return _tempDir;
}