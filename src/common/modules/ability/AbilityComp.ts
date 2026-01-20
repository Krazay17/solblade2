import { Component } from "@/common/core/ECS"

export class AbilityComp extends Component{
    state: string = "idle";
    lastState: string = "idle";
}