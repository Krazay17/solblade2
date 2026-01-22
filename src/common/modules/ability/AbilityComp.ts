import { Component } from "@/common/core/ECS"
import { Actions } from "@/common/core/SolConstants";

export class AbilityComp extends Component {
    state: string = "idle";
    action: Actions | null = null;

    available: string[] = ["fireball"];
}