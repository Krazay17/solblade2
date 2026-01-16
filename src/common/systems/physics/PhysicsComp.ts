import type RAPIER from "@dimforge/rapier3d-compat";
import { Component } from "../Component";
import type { BodyData } from "@/common/core/SolConstants";

export class PhysicsComp extends Component implements BodyData {
    type: "capsule" | "box" | "pawn" | "ball" | "trimesh" = "capsule";
    collisionGroup?: number | undefined;
    indices?: Uint32Array<ArrayBufferLike> | undefined;
    mass?: number | undefined;
    scale?: number | undefined;
    sensor?: boolean | undefined;
    vertices?: Float32Array<ArrayBufferLike> | undefined;
    body?: RAPIER.RigidBody;
    shape = "capsule";
    height = 1;
    radius = 0.5;
}