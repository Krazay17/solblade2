import type { World } from '@/common/core/World';
import type { ISystem } from "@/common/core/ECS"
import * as THREE from 'three';
import { ViewComp, PhysicsComp, MovementComp } from '@/common/modules';
import type { Rendering } from '../../core/Rendering';
import { SolQuat, SolVec3 } from '@/common/core/SolMath';
import { STModel, SolModel } from './STModel';
import { CameraArm } from '../camera/CameraArm';
import { SOL_RENDER } from '@/common/core/SolConstants';

let _tempVec = new SolVec3();
let _tempThreeVec = new THREE.Vector3();
let _tempQuat = new SolQuat();

export class ViewSystem implements ISystem {
    constructor(private scene: THREE.Scene, private rendering: Rendering) { }
    postUpdate(world: World, dt: number, time: number, alpha: number) {
        const ids = world.query(ViewComp);
        const stModel = world.getSingleton(STModel);
        const camera = world.getSingleton(CameraArm);

        for (const id of ids) {
            const model = stModel.modelMap.get(id);
            const c = world.get(id, ViewComp)!;
            const xform = world.get(id, PhysicsComp);
            if (!model) {
                if (c.isLoading) continue;
                c.isLoading = true;
                this.rendering.createMesh(c.modelName).then((m) => {
                    if (m) {
                        const solModel = new SolModel(m, c);
                        stModel.modelMap.set(id, solModel);
                        if (!c.visible) return;
                        this.scene.add(solModel.anchor);
                    }
                    c.isLoading = false;
                });
                continue;
            }
            if (xform) {
                model.anchor.position.lerpVectors(xform.lastPos, xform.pos, alpha);

                const move = world.get(id, MovementComp);
                if (move) model.anchor.quaternion.copy(_tempQuat.applyYaw(move.yaw));
                else model.anchor.quaternion.copy(SolQuat.slerpQuats(xform.lastRot, xform.rot, alpha));

                const dist = camera.yawObject.position.distanceTo(model.anchor.position);
                if (model.inScene && dist > SOL_RENDER.ENTITY_RENDER_DISTANCE) {
                    model.inScene = false;
                    model.anchor.remove(model.model);
                } else {
                    model.inScene = true;
                    model.anchor.add(model.model);
                }
            }
        }
    }
}