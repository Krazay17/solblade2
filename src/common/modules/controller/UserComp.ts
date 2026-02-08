import { Component } from "#/common/core/ECS";
export type TInputBuffer =  { seq: number, mask: number, yaw: number, pitch: number };
export class UserComp extends Component {
    actions = {
        pressed: 0,
        held: 0
    };
    yaw: number = 0;
    pitch: number = 0;

    // Identity
    uid: string = "";
    socketId: string = "";
    pawnId: number | null = null;
    changePawn: number | null = null;

    // Network reconciliation
    inputBuffer: TInputBuffer[] = [];
    lastProcessedSeq: number = 0;
}