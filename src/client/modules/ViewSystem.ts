import type { World } from '@/common/core/World';
import type { Component } from '@/common/systems/Component';
import type { ISystem } from '@/common/systems/System';
import * as THREE from 'three';
import { ViewComp } from '../../common/systems/view/ViewComp';
import type { Rendering } from '../core/Rendering';
import { PhysicsComp } from '@/common/systems/physics/PhysicsComp';

export class ViewSystem implements ISystem {
    private models = new Map<number, THREE.Object3D>();
    //private components: ViewComp[] = [];

    constructor(private scene: THREE.Scene, private rendering: Rendering) { }
    addComp(comp: Component): void {
        // if (comp instanceof ViewComp) {
        //     this.components.push(comp);
        // }
    }
    update(world: World, dt: number): void {
    }
    postTick(world: World, alpha: number) {
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
                //model.quaternion.slerpQuaternions(xform.lastRot as THREE.Quaternion, xform.rot as THREE.Quaternion, alpha);
            }
        }
    }
    preTick() {

    }
}