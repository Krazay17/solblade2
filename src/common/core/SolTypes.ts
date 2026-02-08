
export enum SnapshotIndices {
    ID = 0,
    IS_ACTIVE = 1,
    TYPE = 2,
    OWNERID = 3,
    OWNERSTEP = 4,
    POS_X = 5,
    POS_Y = 6,
    POS_Z = 7,
    YAW = 8,
    MOVESTATE = 9,
    ABILITYSTATE = 10,
}

// Create a strict Tuple type
export type EntityState = [
    eid: number,
    active: boolean,
    type: number,
    ownerId: number,
    iid: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
    moveState: string | null,
    abilityState: string | null,
];

export interface Snapshot {
    t: number;  // timestamp
    tk: number; // tick count
    us: any[];
    e: EntityState[];
}