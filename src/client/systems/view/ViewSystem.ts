import type { World } from '@/common/core/World';
import type { Component } from '@/common/systems/Component';
import type { ISystem } from '@/common/systems/System';
import * as THREE from 'three';
import { ViewComp } from '../../../common/systems/view/ViewComp';
import type { Rendering } from '../../core/Rendering';
import { TransformComp } from '@/common/systems';
import { PhysicsComp } from '@/common/systems/physics/PhysicsComp';

export class ViewSystem implements ISystem {
    private models = new Map<number, THREE.Object3D>();
    private components: ViewComp[] = [];

    constructor(private scene: THREE.Scene, private rendering: Rendering) { }
    addComp(comp: Component): void {
        if (comp instanceof ViewComp) {
            this.components.push(comp);
        }
    }
    update(world: World, dt: number): void {
    }
    postTick(world: World, alpha: number) {
        for (const c of this.components) {
            const model = this.models.get(c.entityId);
            if (!model) {
                if (c.isLoading) continue;
                c.isLoading = true;
                this.rendering.createMesh(c.modelName).then((m) => {
                    if (m) {
                        this.models.set(c.entityId, m)
                        console.log('addedCube');
                        this.scene.add(m);
                        c.isLoading = false;
                    }
                });
                continue;
            }
            const xform = world.getComponent(c.entityId, PhysicsComp);
            if (xform) {
                model.position.lerpVectors(xform.lastPos, xform.body!.translation(), alpha);
                //model.quaternion.slerpQuaternions(xform.lastRot as THREE.Quaternion, xform.rot as THREE.Quaternion, alpha);
            }
        }
    }
}