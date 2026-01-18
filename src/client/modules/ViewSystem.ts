import type { World } from '@/common/core/World';
import type { ISystem } from '@/common/systems/System';
import * as THREE from 'three';
import { ViewComp } from '../../common/systems/view/ViewComp';
import type { Rendering } from '../core/Rendering';
import { PhysicsComp } from '@/common/systems/physics/PhysicsComp';
import { SolQuat } from '@/common/core/SolMath';

export class ViewSystem implements ISystem {
    private models = new Map<number, THREE.Object3D>();

    constructor(private scene: THREE.Scene, private rendering: Rendering) { }
    postUpdate(world: World, dt: number, time: number, alpha: number) {
        const ids = world.query(ViewComp);
        for (const id of ids) {
            const model = this.models.get(id);
            const c = world.get(id, ViewComp)!;
            if (!model) {
                if (c.isLoading) continue;
                c.isLoading = true;
                this.rendering.createMesh(c.modelName).then((m) => {
                    if (m) {
                        this.models.set(id, m);
                        this.scene.add(m);
                        c.isLoading = false;
                    }
                });
                continue;
            }
            const xform = world.get(id, PhysicsComp);
            if (xform?.body) {
                model.position.lerpVectors(xform.lastPos, xform.body!.translation(), alpha);
                model.quaternion.copy(SolQuat.slerpQuats(xform.lastRot, xform.body!.rotation() as SolQuat, alpha));
            }
        }
    }
}