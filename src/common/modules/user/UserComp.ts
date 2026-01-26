import { Component } from "#/common/core/ECS";

export class UserComp extends Component {
    socketId: string = "";
    pawnId: number | null = null; // The Entity ID of the Wizard they are currently controlling

    // Input History for Rollback/Reconciliation
    inputBuffer: Array<{ seq: number, mask: number, yaw: number, pitch: number }> = [];
    lastProcessedSeq: number = 0;

    // Network Stats
    ping: number = 0;
    username: string = "Player";
}