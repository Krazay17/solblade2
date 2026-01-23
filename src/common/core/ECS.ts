import type { World } from "../core/World";
import type { MovementComp } from "../modules";
import type { AbilityComp } from "../modules/ability/AbilityComp";

export class Entity {
    entityId: number;
    components: any[] = [];
    constructor(id: number) {
        this.entityId = id;
    }
}
export abstract class Component {
    public entityId: number = -1;
}

export interface ISystem {
    preUpdate?(world: World, dt: number, time: number): void;
    preStep?(world: World, dt: number, time: number): void;
    step?(world: World, dt: number, time: number): void;
    postStep?(world: World, dt: number, time: number): void;
    postUpdate?(world: World, dt: number, time: number, alpha: number): void;
}

export abstract class MoveState {
    canEnter(move: MovementComp): boolean { return true };
    canExit(move: MovementComp): boolean { return true };
    enter(move: MovementComp): void { };
    exit(move: MovementComp): void { };
    abstract update(dt: number, move: MovementComp): void;
}
export abstract class AbilityState {
    enter(world: World, id: number, ability: AbilityComp): void { };
    exit(world: World, id: number, ability: AbilityComp): void { };
    update(world: World, id: number, dt: number, ability: AbilityComp): void { };
    canEnter(world: World, id: number, ability: AbilityComp): boolean { return true };
    canExit(world: World, id: number, ability: AbilityComp): boolean { return true };
    charge(): void { };
    fire(): void { };
    recover(): void { };
}
