import type { Component } from "../modules/Component";

export const SOL_PHYS = {
    GRAVITY: { x: 0, y: -9.81, z: 0 },
    TIMESTEP: 1 / 60,
};

export const COLLISION_GROUPS = {
    WORLD: 0b0001,
    PLAYER: 0b0010,
    ENEMY: 0b0100,
    RAY: 0b1000,
    PROJECTILE: 0b1001,
};

export enum Actions {
    JUMP = 1 << 0,
    FWD = 1 << 1,
    BWD = 1 << 2,
    LEFT = 1 << 3,
    RIGHT = 1 << 4,
};

export enum EntityTypes {
    player,
    box,
    box2,
    wizard,
    golem,
}

export interface ComponentDef<T extends Component = Component> {
    type: new () => T;
    data?: Partial<T>;
}

export function defineComponent<T extends Component>(
    type: new () => T,
    data?: Partial<T>
): ComponentDef<T> {
    return { type, data };
}

export interface BodyData {
    type: "pawn" | "capsule" | "cube" | "ball" | "trimesh";
    height?: number;
    radius?: number;
    scale?: number;
    mass?: number;
    collisionGroup?: number;
    sensor?: boolean;
    vertices?: Float32Array;
    indices?: Uint32Array;
}

export enum ControllerType {
    LOCAL_PLAYER,
    REMOTE_PLAYER,
    AI,
    STATIC
}
