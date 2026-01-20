import type { ViewComp } from '@/common/modules';
import * as THREE from 'three';

export class STModel {
    modelMap = new Map<number, SolModel>();
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