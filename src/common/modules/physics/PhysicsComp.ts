import type RAPIER from "@dimforge/rapier3d-compat";
import { Component } from "#/common/core/ECS"
import { SolQuat, SolVec3 } from "#/common/core/SolMath";
import { COLLISION_GROUPS } from "#/common/core/SolConstants";

export class PhysicsComp extends Component {
    type: "capsule" | "cube" | "pawn" | "ball" | "trimesh" = "cube";
    collisionGroup?: number | undefined;
    indices?: Uint32Array<ArrayBufferLike> | undefined;
    mass?: number | undefined;
    scale?: number | undefined;
    sensor?: boolean | undefined;
    vertices?: Float32Array<ArrayBufferLike> | undefined;
    body?: RAPIER.RigidBody;
    static: boolean = true;
    group = COLLISION_GROUPS.PLAYER;
    mask = COLLISION_GROUPS.WORLD;
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