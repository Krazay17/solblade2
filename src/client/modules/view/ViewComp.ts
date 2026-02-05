import { Component } from "#/common/core/ECS"
import type { SolModel } from "./SolRenders";


export class ViewComp extends Component {
    static domain: number = 0;
    modelName = "cube";
    isLoading: boolean = false;
    offsetPos: number = 0;
    offsetRot: number = 0;
    visible: boolean = true;

    public instance?: SolModel
}