import * as THREE from 'three';
import type { Rendering } from './Rendering';
import { Actor } from '@/common/core/Actor';

export class ViewSystem {
    private models = new Map();
    constructor(private scene: THREE.Scene, private rendering: Rendering) { }

    sync(actors: Map<string, Actor>, dt: number) {
        for (const [id, actor] of actors) {
            let mesh = this.models.get(id);

            // 1. Spawn mesh if it doesn't exist
            if (!mesh) {
                const loadTask = this.makeMesh(actor);
                this.models.set(id, loadTask);
                continue;
            }
            if (mesh instanceof THREE.Object3D && actor.body) {
                // 2. Sync transform from Rapier to Three.js
                const pos = actor.body.translation();
                const rot = actor.body.rotation();
                mesh.position.lerp(new THREE.Vector3(pos.x, pos.y - actor.modelOffset, pos.z), 60 * dt);
                mesh.quaternion.slerp(new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w), 60 * dt);
            }
        }

        // 3. Cleanup: Remove models for actors that no longer exist
        for (const id of this.models.keys()) {
            if (!actors.has(id)) {
                const mesh = this.models.get(id);
                if (mesh) this.scene.remove(mesh);
                this.models.delete(id);
            }
        }
    }
    async makeMesh({ id, model }) {
        const mesh = await this.rendering.createMesh(model);
        if (mesh) {
            this.scene.add(mesh);
            this.models.set(id, mesh);
        }
    }
}