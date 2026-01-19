import type RAPIER from "@dimforge/rapier3d-compat";
import { Component } from "../Component";
import { SolQuat, SolVec3 } from "@/common/core/SolMath";

export class PhysicsComp extends Component {
    type: "capsule" | "cube" | "pawn" | "ball" | "trimesh" = "cube";
    collisionGroup?: number | undefined;
    indices?: Uint32Array<ArrayBufferLike> | undefined;
    mass?: number | undefined;
    scale?: number | undefined;
    sensor?: boolean | undefined;
    vertices?: Float32Array<ArrayBufferLike> | undefined;
    body?: RAPIER.RigidBody;
    height = 1;
    radius = 0.5;
    lastPos = new SolVec3();
    lastRot = new SolQuat();
    pos = new SolVec3();
    rot = new SolQuat();
    velocity = new SolVec3();
    transform = new SolVec3();
    makingBody = false;
}