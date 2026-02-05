import type { SolWorld } from '#/common/core/SolWorld';
import { Comps, type ISystem } from "#/common/core/ECS"
import * as THREE from 'three';
import { ViewComp } from './ViewComp';
import { Rendering } from '../../core/Rendering';
import { SolQuat, SolVec3 } from '#/common/core/SolMath';
import { CameraArm } from '../camera/CameraArm';
import { SOL_RENDER } from '#/common/core/SolConstants';
import { SolModel, WorldGroup } from './SolRenders';

let _tempVec = new SolVec3();
let _tempThreeVec = new THREE.Vector3();
let _tempQuat = new SolQuat();

export class ViewSystem implements ISystem {
    // Square the distance once to avoid Math.sqrt in the loop
    private readonly MAX_DIST_SQ = SOL_RENDER.ENTITY_RENDER_DISTANCE ** 2;

    constructor(private rendering: Rendering) { }

    postUpdate(world: SolWorld, dt: number, time: number, alpha: number) {
        const ids = world.query([Comps.View]);
        const camera = world.getSingleton(CameraArm);
        const camPos = camera.yawObject.position;

        for (const id of ids) {
            const c = world.get(id, Comps.View)!;
            const xform = world.get(id, Comps.Transform);

            // 1. Handle Lazy Loading
            if (!c.instance) {
                if (c.isLoading) continue;
                this.handleAsyncLoad(world, id, c);
                continue;
            }

            const model = c.instance;

            if (xform) {
                model.anchor.position.lerpVectors(xform.lastPos, xform.pos, alpha);

                const move = world.get(id, Comps.Movement);
                if (move) {
                    model.anchor.quaternion.copy(SolQuat.slerpQuats(xform.lastQuat, _tempQuat.applyYaw(move.yaw), alpha));
                } else {
                    // Slerp rotation for non-player entities (projectiles, falling items, etc)
                    model.anchor.quaternion.copy(SolQuat.slerpQuats(xform.lastQuat, xform.quat, alpha));
                }

                // 3. Distance-Based Culling (Optimization)
                const distSq = model.anchor.position.distanceToSquared(camPos);
                const shouldBeVisible = distSq < this.MAX_DIST_SQ;

                if (model.inScene !== shouldBeVisible) {
                    model.inScene = shouldBeVisible;
                    if (shouldBeVisible) model.anchor.add(model.model);
                    else model.anchor.remove(model.model);
                }
            }
        }
    }

    removeEntity(world: SolWorld, id: number) {
        const view = world.get(id, Comps.View);
        if (view && view.instance && view.instance.anchor) {
            const mapScene = world.getSingleton(WorldGroup);
            mapScene.group.remove(view.instance.anchor);
        }
    }

    private async handleAsyncLoad(world: SolWorld, id: number, c: ViewComp) {
        c.isLoading = true;
        const m = await this.rendering.createMesh(c.modelName);

        // Check if the entity still exists after the await!
        if (m && world.entities.has(id)) {
            const solModel = new SolModel(m, c);
            c.instance = solModel;

            // SNAP to position immediately so it doesn't flicker at 0,0,0
            const xform = world.get(id, Comps.Transform);
            if (xform) {
                solModel.anchor.position.copy(xform.pos);
                // Also copy rotation if applicable
                const move = world.get(id, Comps.Movement);
                if (move) solModel.anchor.rotation.y = move.yaw;
            }
            const mapScene = world.getSingleton(WorldGroup);
            if (!mapScene) return;
            if (c.visible) mapScene.group.add(solModel.anchor);
        }
        c.isLoading = false;
    }
}