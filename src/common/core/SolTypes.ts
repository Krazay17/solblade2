
export enum SnapshotIndices {
    ID = 0,
    OWNERID = 1,
    IID = 2,
    IS_ACTIVE = 3,
    TYPE = 4,
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
    ownerId: number,
    iid: number,
    active: boolean,
    type: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
    moveState: string | null,
    abilityState: string | null,
];

export type UserState = [
    eid: number,
    uid: string,
    lastProcessedSeq: number,
    pawnId: number,
    bufferLength: number
]

export interface Snapshot {
    t: number;  // timestamp
    tk: number; // tick count
    us: UserState | null;
    e: EntityState[];
}