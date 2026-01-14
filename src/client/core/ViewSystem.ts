import * as THREE from 'three';
import type { Rendering } from './Rendering';
import { Actor } from '@/common/actor/Actor';

export class ViewSystem {
    private meshes = new Map();
    constructor(private scene: THREE.Scene, private rendering: Rendering) { }

    sync(actors: Map<string, Actor>) {
        for (const [id, actor] of actors) {
            let mesh = this.meshes.get(id);

            // 1. Spawn mesh if it doesn't exist
            if (!mesh) {
                const loadTask = this.makeMesh(actor);
                this.meshes.set(id, loadTask);
                continue;
            }
            if (mesh instanceof THREE.Object3D && actor.body) {
                // 2. Sync transform from Rapier to Three.js
                const pos = actor.body.translation();
                const rot = actor.body.rotation();
                mesh.position.set(pos.x, pos.y, pos.z);
                mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
            }
        }

        // 3. Cleanup: Remove meshes for actors that no longer exist
        for (const id of this.meshes.keys()) {
            if (!actors.has(id)) {
                const mesh = this.meshes.get(id);
                if (mesh) this.scene.remove(mesh);
                this.meshes.delete(id);
            }
        }
    }
    async makeMesh({id, model}) {
        const mesh = await this.rendering.createMesh(model);
        if(mesh){
            this.scene.add(mesh);
            this.meshes.set(id, mesh);
        }
    }
}