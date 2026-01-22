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

export interface IMoveState {
    enter(comp: MovementComp): void;
    exit(comp: MovementComp): void;
    update(dt: number, comp: MovementComp): void;
}
export interface IAbilityState {
    enter(world: World, id: number): void;
    exit(world: World, id: number): void;
    update(world: World, id: number, dt: number): void;
    canEnter(world: World, id: number): boolean;
    canExit(world: World, id: number): boolean;
}
