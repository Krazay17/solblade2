import type { World } from "../core/World";
import type { Component } from "./Component";

export interface ISystem {
    addComp(comp: Component): void;
    update(world: World, dt: number, time: number): void;
}