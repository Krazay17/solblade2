
export enum SnapshotIndices {
    ID = 0,
    IS_ACTIVE = 1,
    TYPE = 2,
    OWNERID = 3,
    IID = 4,
    POS_X = 5,
    POS_Y = 6,
    POS_Z = 7,
    YAW = 8,
    MOVESTATE = 9,
    VEL_X = 10,
    VEL_Y = 11,
    VEL_Z = 12,
    ABILITYSTATE = 13,
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
    vx: number,
    vy: number,
    vz: number,
    abilityState: string | null,
];

export type UserState = [
    eid: number,
    uid: string,
    time: number,
    lastProcessedSeq: number,
    pawnId: number,
    bufferLength: number
]

export interface Snapshot {
    t: number;  // timestamp
    tk: number; // tick count
    us: UserState;
    e: EntityState[];
}