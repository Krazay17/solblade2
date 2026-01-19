import { SolVec3 } from "@/common/core/SolMath";
import { Component } from "../Component";
import { Actions } from "@/common/core/SolConstants";

export class MovementComp extends Component {
    state = "idle";
    lastState = "idle";
    velocity = new SolVec3();
    actionMap = new Map<Actions, boolean>();
    yaw = 0;
    pitch = 0;
    speed = 5;
    accel = 10;
    friction = 5;
    jumpHeight = 5;
    dashTime = 1;
    hasMovementInput(): boolean {
        return !!(
            this.actionMap.get(Actions.FWD) ||
            this.actionMap.get(Actions.BWD) ||
            this.actionMap.get(Actions.LEFT) ||
            this.actionMap.get(Actions.RIGHT)
        );
    }
}