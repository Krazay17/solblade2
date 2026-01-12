import type RAPIER from "@dimforge/rapier3d-compat";
import type * as THREE from "three";

export class Actor {
    public id: string = crypto.randomUUID();
    public body?: RAPIER.RigidBody;
    public mesh?: THREE.Group;
    constructor(
        public pos: number[] = [0, 0, 0],
        public quat: number[] = [0, 0, 0, 1]
    ) {
    }
}