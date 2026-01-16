import type RAPIER from "@dimforge/rapier3d-compat";
import type { MovementComp } from "../systems/movement/MovementComp";

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
    scale?: number;
}

export class xForm {
    pos = { x: 0, y: 0, z: 0, }
    quat = { x: 0, y: 0, z: 0, w: 1 }
    constructor(x: number, y: number, z: number, rx?: number, ry?: number, rz?: number, rw?: number) {
        this.pos.x = x;
        this.pos.y = y;
        this.pos.z = z;
        this.quat.x = rx ?? 0;
        this.quat.y = ry ?? 0;
        this.quat.z = rz ?? 0;
        this.quat.w = rw ?? 1;
    }
}

export class Actor implements ActorInit {
    public type: string;
    public id: string;
    public model: string;
    public modelOffset: number = 0;
    public scale: number;
    public body?: RAPIER.RigidBody;
    public movement?: MovementComp;

    private components = new Map<string, any>();

    constructor(init: ActorInit) {
        this.type = init.type ?? "cube";
        this.id = init.id ?? crypto.randomUUID();
        this.model = init.model ?? "cube";
        this.scale = init.scale ?? 1;
    }
    get position() {
        return this.body?.translation();
    }
    add<T>(name: string, component: any) {
        this.components.set(name, component);
        if(name === "MovementComp") this.movement = component;
    }
    get<T>(name: string): T {
        return this.components.get(name);
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