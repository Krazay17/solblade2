import type { World } from '@/common/core/World';
import type { ISystem } from '@/common/modules/System';
import * as THREE from 'three';
import { ViewComp, PhysicsComp, MovementComp } from '@/common/modules';
import type { Rendering } from '../core/Rendering';
import { SolQuat, SolVec3 } from '@/common/core/SolMath';
import { STModel, SolModel } from './STModel';
import { LocalUser } from './LocalUser';

let _tempVec = new SolVec3();
let _tempQuat = new SolQuat();

export class ViewSystem implements ISystem {
    constructor(private scene: THREE.Scene, private rendering: Rendering) { }
    postUpdate(world: World, dt: number, time: number, alpha: number) {
        const ids = world.query(ViewComp);
        const stModel = world.getSingleton(STModel);
        for (const id of ids) {
            const model = stModel.modelMap.get(id);
            const c = world.get(id, ViewComp)!;
            if (!model) {
                if (c.isLoading) continue;
                c.isLoading = true;
                this.rendering.createMesh(c.modelName).then((m) => {
                    if (m) {
                        const solModel = new SolModel(m, c);
                        stModel.modelMap.set(id, solModel);

                        this.scene.add(solModel.anchor);
                    }
                    c.isLoading = false;
                });
                continue;
            }
            const xform = world.get(id, PhysicsComp);
            if (xform?.body) {
                model.anchor.position.lerpVectors(xform.lastPos, xform.pos, alpha);
                const move = world.get(id, MovementComp);
                if (move) model.anchor.quaternion.copy(_tempQuat.applyYaw(move.yaw));
                else model.anchor.quaternion.copy(SolQuat.slerpQuats(xform.lastRot, xform.rot, alpha));
            }
        }
    }
}