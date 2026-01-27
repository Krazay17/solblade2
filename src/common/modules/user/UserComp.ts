import { Component } from "#/common/core/ECS";

export class UserComp extends Component {
    actions = {
        pressed: 0,
        held: 0
    };
    yaw: number = 0;
    pitch: number = 0;

    // Identity
    socketId: string = "";
    pawnId: number | null = null;
    pendingPawnId: number | null = null;

    // Network reconciliation
    inputBuffer: Array<{ seq: number, mask: number, yaw: number, pitch: number }> = [];
    lastProcessedSeq: number = 0;
}