import { Component } from "@/common/core/ECS";

export class VitalsComp extends Component {
    maxHealth: number = 100;
    health: number = 100;
    maxEnergy: number = 100;
    energy: number = 100;
}