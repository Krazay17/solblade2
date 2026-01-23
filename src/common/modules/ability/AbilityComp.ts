import { Component } from "#/common/core/ECS"
import { Actions } from "#/common/core/SolConstants";

export class AbilityComp extends Component {
    state: string = "idle";
    action: Actions | null = null;
    requestedState: string | null = null;
    duration: number = 0;
    timer: number = 0;
    available: string[] = ["fireball"];
    cooldownMap = new Map<string, number>();
}