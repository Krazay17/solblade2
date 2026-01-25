import { Component } from "#/common/core/ECS";
import { ControllerType, EntityTypes } from "#/common/core/SolConstants";

export class NetsyncComp extends Component {
    active: boolean = true;
    isDirty: boolean = false;
    type: EntityTypes = EntityTypes.box;
    controllerType: ControllerType = ControllerType.LOCAL_PLAYER;
    netId: number = -1;
    posX: number = 0;
    posY: number = 0;
    posZ: number = 0;
    yaw: number = 0;
    pitch: number = 0;
    anim: string = "idle";
    aState: string = "idle";
    mState: string = "idle";
}