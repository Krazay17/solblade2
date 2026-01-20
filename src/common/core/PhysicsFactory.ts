import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS, ControllerType } from "./SolConstants";
import type { PhysicsComp } from "../modules/physics/PhysicsComp";


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
export function createBody(world: RAPIER.World, data: PhysicsComp, controller: ControllerType) {
    const h = (data.height ?? 1) * (data.scale ?? 1);
    const r = (data.radius ?? 0.5) * (data.scale ?? 1);
    const type = data.type || "pawn";

    const bodyD = controller === ControllerType.LOCAL_PLAYER || controller == ControllerType.AI
        ? RAPIER.RigidBodyDesc.dynamic()
        : RAPIER.RigidBodyDesc.kinematicPositionBased();

    bodyD.setTranslation(data.pos.x, data.pos.y, data.pos.z);
    bodyD.setLinvel(data.velocity.x || 0, data.velocity.y || 0, data.velocity.z || 0);
    bodyD.setLinearDamping(.1);

    let colliderD: RAPIER.ColliderDesc;

    switch (type) {
        case "capsule":
        case "pawn":
            colliderD = RAPIER.ColliderDesc.capsule(h / 2, r);
            colliderD.setFriction(0).setRestitution(0);
            bodyD.lockRotations().setLinearDamping(0).setAngularDamping(0);
            break;
        case "cube":
            colliderD = RAPIER.ColliderDesc.cuboid(r, r, r);
            break;
        case "ball":
            colliderD = RAPIER.ColliderDesc.ball(r);
            break;
        case "trimesh":
            if (!data.vertices || !data.indices) throw new Error("Trimesh missing data");
            colliderD = RAPIER.ColliderDesc.trimesh(
                data.vertices as Float32Array,
                data.indices as Uint32Array
            );
            break;
        default:
            throw new Error(`Unknown type: ${type}`);
    }

    const group = resolveCollisionGroup(type, controller, data.collisionGroup);
    if (group) colliderD.setCollisionGroups(group);

    if (data.sensor) colliderD.setSensor(true);

    const body = world.createRigidBody(bodyD);
    const collider = world.createCollider(colliderD, body);

    if (data.mass !== undefined) collider.setMass(data.mass);

    return { body, collider };
}
function resolveCollisionGroup(type: string, controller: ControllerType, override?: number): number | null {
    if (override) return override;

    // Projectiles
    if (type === "ball") {
        return COLLISION_GROUPS.PROJECTILE << 16 | COLLISION_GROUPS.WORLD;
    }

    // Pawns / Players / Enemies
    if (type === "pawn") {
        // isProxy = true usually means it's an enemy or remote player
        if (controller === ControllerType.LOCAL_PLAYER || controller == ControllerType.AI) {
            return COLLISION_GROUPS.ENEMY << 16 | (COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.WORLD);
        } else {
            return COLLISION_GROUPS.PLAYER << 16 | (COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY);
        }
    }

    return null;
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