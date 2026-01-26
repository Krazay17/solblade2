import { SolVec3 } from "#/common/core/SolMath";
import { Component } from "#/common/core/ECS"
import { Actions } from "#/common/core/SolConstants";


export enum StateBits {
    none = 0,
    walk = 1,
    jump = 1 << 1,
}

export class MovementComp extends Component {
    desiredState: string | null = null;
    state: string = "idle";
    wishdir = new SolVec3();
    velocity = new SolVec3();
    prevVelocity = new SolVec3();
    actions = {
        justPressed: new Set<Actions>(),
        held: 0,
    }
    augmentSpeed = 1;
    isGrounded = true;
    yaw = 0;
    prevYaw = 0;
    pitch = 0;
    speed = 5;
    accel = 10;
    friction = 5;
    jumpHeight = 5;
    dashTime = 1;
    jumpDuration = 1;
    jumpTimer = 0;
    wantsJump: boolean = false;
    wantsMove: boolean = false;
    hasMovementInput(): boolean {
        const mask = Actions.FWD | Actions.BWD | Actions.LEFT | Actions.RIGHT
        return !!(this.actions.held & mask);
    }
}