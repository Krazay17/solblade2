import { Component } from "#/common/core/ECS";

export enum StatusType {
    NONE = 0,
    STUN = 1 << 0,
    ROOT = 1 << 1,
    SILENCE = 1 << 2,
    BURN = 1 << 3,
}

interface StatusEffect {
    type: StatusType;
    duration: number;
    damage?: number;
}

export class StatusComp extends Component {
    public flags: number = 0;

    public activeEffects: Map<StatusType, StatusEffect> = new Map();
}
