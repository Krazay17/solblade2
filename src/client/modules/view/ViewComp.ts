import { Component } from "@/common/core/ECS"
import type { SolModel } from "./ViewSystem";

export class ViewComp extends Component {
    modelName = "cube";
    isLoading: boolean = false;
    offsetPos: number = 0;
    offsetRot: number = 0;
    visible: boolean = true;

    public instance?: SolModel
}