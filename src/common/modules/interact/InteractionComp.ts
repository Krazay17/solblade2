import { Component } from "#/common/core/ECS";

export class InteractionComp extends Component {
    static domain = 1;
    
    range: number = 3.0;
    shapeRadius: number = 0.5; // For sphere cast
    lastInteractTime: number = 0;
    interactCooldown: number = 0.5; // seconds
    currentTarget: number = -1; // Currently highlighted/targeted interactable

    wantsInteract: boolean = false;
}