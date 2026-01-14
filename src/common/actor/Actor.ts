import type RAPIER from "@dimforge/rapier3d-compat";

export enum ControllerType {
    LOCAL_PLAYER, // Client predicts this
    REMOTE_PLAYER, // Client interpolates this (puppet)
    AI,            // Server calculates this, Client puppets it
    STATIC         // Environment (no movement logic)
}

export interface ActorInit {
    type: string;
    id?: string;
    model?: string;
    pos?: Array<number>;
    quat?: Array<number>;
    scale?: number;
}

export class Actor implements ActorInit {
    public type: string;
    public id: string;
    public model: string;
    public scale: number;
    public pos: Array<number>;
    public quat: Array<number>;
    public body?: RAPIER.RigidBody;
    constructor(init: ActorInit) {
        this.type = init.type ?? "cube";
        this.id = init.id ?? crypto.randomUUID();
        this.model = init.model ?? "cube";
        this.pos = init.pos ?? [0, 0, 0];
        this.quat = init.quat ?? [0, 0, 0, 1];
        this.scale = init.scale ?? 1;
    }
    applyYaw(yaw: number) {
        if (!this.body) return;
        const q = {
            x: 0,
            y: Math.sin(yaw / 2),
            z: 0,
            w: Math.cos(yaw / 2)
        };
        this.body.setRotation(q, true);
    }
}