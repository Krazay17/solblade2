import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS, SOL_PHYS } from "../config/SolConstants";
import type { BodyData } from "../config/ActorConfig";
import { Actor } from "../actor/Actor";

await RAPIER.init();

export class Physics {
    public world = new RAPIER.World(SOL_PHYS.GRAVITY);
    remove() { this.world.free() }
    step(dt: number, time: number) { this.world.step() }
    async loadMap(name: string) {
        let worldData;
        const worldModule = await import(`../config/data/${name}.json`);
        worldData = worldModule.default;
        if (!worldData) return;
        const colliders = colliderFromJson(worldData);
        for (const { vertices, indices } of colliders) {
            const desc = RAPIER.ColliderDesc.trimesh(vertices, indices);
            desc.setCollisionGroups(COLLISION_GROUPS.WORLD << 16 | (COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.PLAYER));

            this.world.createCollider(desc);
        }
    }
    createBody(actor: Actor, data: BodyData, scale: number = 1, isProxy: boolean = false) {
        const h = (data.height ?? 1) * scale;
        const r = (data.radius ?? 0.5) * scale;
        const type = data.type || "pawn";

        const bodyD = isProxy
            ? RAPIER.RigidBodyDesc.kinematicPositionBased()
            : RAPIER.RigidBodyDesc.dynamic();

        let colliderD: RAPIER.ColliderDesc;

        switch (type) {
            case "capsule":
            case "pawn":
                colliderD = RAPIER.ColliderDesc.capsule(h / 2, r);
                if (type === "pawn") {
                    bodyD.lockRotations().setLinearDamping(0).setAngularDamping(0);
                }
                break;
            case "box":
                colliderD = RAPIER.ColliderDesc.cuboid(h, h, h);
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

        const group = this.resolveCollisionGroup(type, isProxy, data.collisionGroup);
        if (group) colliderD.setCollisionGroups(group);

        colliderD.setFriction(0).setRestitution(0);
        if (data.sensor) colliderD.setSensor(true);

        const body = this.world.createRigidBody(bodyD);
        body.setTranslation({ x: actor.pos[0], y: actor.pos[1], z: actor.pos[2] }, true);
        const collider = this.world.createCollider(colliderD, body);

        if (data.mass !== undefined) collider.setMass(data.mass);

        return { body, collider };
    }
    private resolveCollisionGroup(type: string, isProxy: boolean, override?: number): number | null {
        if (override) return override;

        // Projectiles
        if (type === "ball") {
            return COLLISION_GROUPS.PROJECTILE << 16 | COLLISION_GROUPS.WORLD;
        }

        // Pawns / Players / Enemies
        if (type === "pawn") {
            // isProxy = true usually means it's an enemy or remote player
            if (isProxy) {
                return COLLISION_GROUPS.ENEMY << 16 | (COLLISION_GROUPS.PLAYER | COLLISION_GROUPS.WORLD);
            } else {
                return COLLISION_GROUPS.PLAYER << 16 | (COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY);
            }
        }

        return null;
    }
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