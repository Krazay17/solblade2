import { Component } from "../Component";

export class ViewComp extends Component {
    modelName = "cube";
    isLoading: boolean = false;
    offsetPos: number = 0;
    offsetRot: number = Math.PI;
    animation: string = "idle";
}