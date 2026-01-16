export const SOL_PHYS = {
    GRAVITY: {x:0, y:-9.81, z:0},
    TIMESTEP: 1/60,
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