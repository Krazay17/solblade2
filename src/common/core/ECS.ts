import type { SolWorld } from "./SolWorld";
import type { AbilityComp } from "../modules/ability/AbilityComp";

export enum Comps {
    User,
    Transform,
    Physics,
    View,
    Movement,
    Animation,
    Ability,
    Vitals,
    Nameplate,
    Meta,
    Local,
    Remote,
    Authority,
    Owner,
    Status,
}

export enum Maps {
    world0,
    world1,
    world2,
    world3,
}
export const MapReg: Record<Maps, string> = {
    [Maps.world0]: "World0",
    [Maps.world1]: "World1",
    [Maps.world2]: "World2",
    [Maps.world3]: "World3",
}

export class Entity {
    entityId: number;
    components: any[] = [];
    constructor(id: number) {
        this.entityId = id;
    }
}
export abstract class Component {
    public entityId: number = -1;
    static domain = 1;
}

export interface ISystem {
    preUpdate?(world: SolWorld, dt: number, time: number): void;
    preStep?(world: SolWorld, dt: number, time: number): void;
    step?(world: SolWorld, dt: number, time: number): void;
    postStep?(world: SolWorld, dt: number, time: number): void;
    postUpdate?(world: SolWorld, dt: number, time: number, alpha: number): void;
    noRecoveryStep?(worlds: SolWorld[]): void;
    removeEntity?(world: SolWorld, id: number): void;
    process?(world: SolWorld, id: number, dt: number, time: number): void;
    destroy?(world: SolWorld): void;
}

export abstract class AbilityState {
    enter(world: SolWorld, id: number, ability: AbilityComp): void { };
    exit(world: SolWorld, id: number, ability: AbilityComp): void { };
    update(world: SolWorld, id: number, dt: number, ability: AbilityComp): void { };
    canEnter(world: SolWorld, id: number, ability: AbilityComp): boolean { return true };
    canExit(world: SolWorld, id: number, ability: AbilityComp): boolean { return true };
    charge(): void { };
    fire(): void { };
    recover(): void { };
}