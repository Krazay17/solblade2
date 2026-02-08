import { Component } from "#/common/core/ECS";
import type { SolWorld } from "#/common/core/SolWorld";

export class InteractableComp extends Component {
    static domain = 1; // Both client and server

    enabled: boolean = true;
    interactRadius: number = 2.0;
    interactPrompt: string = "Press E to interact";
    onInteract?: (world: SolWorld, interactorId: number, targetId: number) => void;
    cooldown: number = 0;
    lastInteraction: number = 0;
}