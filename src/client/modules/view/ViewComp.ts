import { Component } from "@/common/core/ECS"

export class ViewComp extends Component {
    modelName = "cube";
    isLoading: boolean = false;
    offsetPos: number = 0;
    offsetRot: number = 0;
    animation: string = "idle";
    visible: boolean = true;
}