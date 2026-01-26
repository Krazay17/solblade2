import type { World } from '#/common/core/World';
import type { ISystem } from "#/common/core/ECS"
import * as THREE from 'three';
import { PhysicsComp, MovementComp } from '#/common/modules';
import { ViewComp } from './ViewComp';
import type { Rendering } from '../../core/Rendering';
import { SolQuat, SolVec3 } from '#/common/core/SolMath';
import { CameraArm } from '../camera/CameraArm';
import { SOL_RENDER } from '#/common/core/SolConstants';
import { TransformComp } from '#/common/modules/transform/TransformComp';

let _tempVec = new SolVec3();
let _tempThreeVec = new THREE.Vector3();
let _tempQuat = new SolQuat();

export class ViewSystem implements ISystem {
    // Square the distance once to avoid Math.sqrt in the loop
    private readonly MAX_DIST_SQ = SOL_RENDER.ENTITY_RENDER_DISTANCE ** 2;

    constructor(private rendering: Rendering, private scene: THREE.Scene) { }

    postUpdate(world: World, dt: number, time: number, alpha: number) {
        const ids = world.query(ViewComp);
        const camera = world.getSingleton(CameraArm);
        const camPos = camera.yawObject.position;

        for (const id of ids) {
            const c = world.get(id, ViewComp)!;
            const xform = world.get(id, TransformComp);

            // 1. Handle Lazy Loading
            if (!c.instance) {
                if (c.isLoading) continue;
                this.handleAsyncLoad(c);
                continue;
            }

            const model = c.instance;

            // 2. Interpolate Position and Rotation for "Buttery Smooth" 144Hz+ rendering
            if (xform) {
                model.anchor.position.lerpVectors(xform.lastPos, xform.pos, alpha);

                const move = world.get(id, MovementComp);
                if (move) {
                    model.anchor.quaternion.copy(_tempQuat.applyYaw(move.yaw));
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

    private async handleAsyncLoad(c: ViewComp) {
        c.isLoading = true;
        const m = await this.rendering.createMesh(c.modelName);
        if (m) {
            const solModel = new SolModel(m, c);
            c.instance = solModel;
            if (c.visible) this.scene.add(solModel.anchor);
        }
        c.isLoading = false;
    }
}

export class SolModel {
    anchor: THREE.Group = new THREE.Group();
    model: THREE.Object3D;
    visible = true;
    inScene = false;
    mixer?: THREE.AnimationMixer;
    anims?: Record<string, THREE.AnimationClip>;
    currentAction?: THREE.AnimationAction;
    currentAnimName?: string;

    constructor(model: THREE.Object3D, view: ViewComp) {
        this.model = model;
        this.model.position.set(0, view.offsetPos, 0);
        this.model.rotation.y = view.offsetRot;
        this.anchor.add(this.model);
        if (this.model.animations) {
            this.mixer = new THREE.AnimationMixer(this.model);
            this.anims = {};
            for (const a of this.model.animations) {
                this.anims[a.name] = a;
            }
        }
    }

    play(name: string, duration: number = 0.2) {
        if (this.currentAnimName === name || !this.anims || !this.mixer) return; // Already playing
        
        const clip = this.anims[name];
        if (!clip) return;

        const newAction = this.mixer.clipAction(clip);

        if (this.currentAction) {
            // Smoothly transition from old anim to new one
            newAction.reset().fadeIn(duration).play();
            this.currentAction.fadeOut(duration);
        } else {
            newAction.play();
        }

        this.currentAction = newAction;
        this.currentAnimName = name;
    }
}