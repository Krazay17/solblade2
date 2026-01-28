import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS } from "./SolConstants";
import type { PhysicsComp } from "../modules/physics/PhysicsComp";
import type { TransformComp } from "../modules/transform/TransformComp";


export async function loadMap(world: RAPIER.World, name: string) {
    let worldData;
    const worldModule = await import(`../data/${name}.json`);
    worldData = worldModule.default;
    if (!worldData) return;
    const colliders = colliderFromJson(worldData);
    for (const { vertices, indices } of colliders) {
        const desc = RAPIER.ColliderDesc.trimesh(vertices, indices);
        desc.setCollisionGroups(COLLISION_GROUPS.WORLD << 16 | (COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.PLAYER));

        world.createCollider(desc);
    }
}
export function createBody(world: RAPIER.World, phys: PhysicsComp, xform?: TransformComp, auth: boolean = true) {
    const h = (phys.height ?? 1) * (phys.scale ?? 1);
    const r = (phys.radius ?? 0.5) * (phys.scale ?? 1);
    const type = phys.type || "pawn";

    const bodyD = auth && !phys.static
        ? RAPIER.RigidBodyDesc.dynamic()
        : RAPIER.RigidBodyDesc.kinematicPositionBased();

    if (xform) {
        bodyD.setTranslation(xform.pos.x, xform.pos.y, xform.pos.z);
    }
    if (phys.velocity) {
        bodyD.setLinvel(phys.velocity.x || 0, phys.velocity.y || 0, phys.velocity.z || 0);
    }
    bodyD.setLinearDamping(.1);

    let colliderD: RAPIER.ColliderDesc;

    switch (type) {
        case "capsule":
        case "pawn":
            colliderD = RAPIER.ColliderDesc.capsule(h / 2, r);
            colliderD.setFriction(0).setRestitution(0);
            bodyD.lockRotations();
            break;
        case "cube":
            colliderD = RAPIER.ColliderDesc.cuboid(r, r, r);
            break;
        case "ball":
            colliderD = RAPIER.ColliderDesc.ball(r);
            break;
        case "trimesh":
            if (!phys.vertices || !phys.indices) throw new Error("Trimesh missing data");
            colliderD = RAPIER.ColliderDesc.trimesh(
                phys.vertices as Float32Array,
                phys.indices as Uint32Array
            );
            break;
        default:
            throw new Error(`Unknown type: ${type}`);
    }
    const mask = auth ? phys.mask : 0;
    colliderD.setCollisionGroups(phys.group << 16 | mask);

    if (phys.sensor) colliderD.setSensor(true);

    const body = world.createRigidBody(bodyD);
    const collider = world.createCollider(colliderD, body);

    if (phys.mass !== undefined) collider.setMass(phys.mass);

    return { body, collider };
}

export function bodyPhysChange(phys: PhysicsComp, auth: boolean) {
    const rb = phys.body;
    if (!rb) return;
    const rbType = auth ?
        RAPIER.RigidBodyType.Dynamic :
        RAPIER.RigidBodyType.KinematicPositionBased;
    rb.setBodyType(rbType, true);
    const mask = auth ? phys.mask : 0;
    rb.collider(0).setCollisionGroups(phys.group << 16 | mask);
}

function colliderFromJson(data: any) {
    const colliders: Array<{ vertices: Float32Array; indices: Uint32Array }> = [];
    for (const obj of data) {
        if (!obj.vertices?.length || !obj.indices?.length) {
            console.warn("Skipping object with missing vertices or indices:", obj.name);
            continue;
        }

        // Filter vertices to ensure each has 3 numbers
        const filteredVerts = obj.vertices.filter(v => Array.isArray(v) && v.length === 3);
        if (filteredVerts.length === 0) {
            console.warn("Skipping object with no valid vertices:", obj.name);
            continue;
        }

        const vertices = new Float32Array(filteredVerts.flat());

        // Flatten indices
        const indices = new Uint32Array(obj.indices.flat());
        const maxIndex = Math.max(...indices);
        if (maxIndex >= vertices.length / 3) {
            console.warn("Skipping object with indices out of bounds:", obj.name);
            continue;
        }

        colliders.push({ vertices, indices });
    }
    return colliders;
}