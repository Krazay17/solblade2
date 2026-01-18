import type { World } from "../core/World";

export interface ISystem {
    preUpdate?(world: World, dt: number, time: number): void;
    preStep?(world: World, dt: number, time: number): void;
    step?(world: World, dt: number, time: number): void;
    postStep?(world: World, dt: number, time: number): void;
    postUpdate?(world: World, dt: number, time: number, alpha: number): void;
}