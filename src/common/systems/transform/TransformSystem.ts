import type { World } from "@/common/core/World";
import type { Component } from "../Component";
import type { ISystem } from "../System";
import { TransformComp } from "./TransformComp";
import RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init();

export class TransformSystem implements ISystem {
    private bodies = new Map<number, RAPIER.RigidBody>();
    private components: TransformComp[] = [];

    addComp(comp: Component): void {
        if (comp instanceof TransformComp) this.components.push(comp);
    }

    update(world: World, dt: number): void {
        // for (const c of this.components) {
        //     c.lastPos.copy(c.pos);
        //     c.lastRot.copy(c.rot);
        //     const body = this.bodies.get(c.entityId)
        //     if (body) {
        //         c.pos.copy(body.translation());
        //         c.rot.copy(body.rotation());
        //     }
        // }
        this.preStep();
        this.postStep();
    }

    preStep() {
        for (const c of this.components) {
            c.lastPos.copy(c.pos);
            c.lastRot.copy(c.rot);
        }
    }
    
    postStep() {
        for (const c of this.components) {
            const body = this.bodies.get(c.entityId);
            if (body) {
                // Sync Rapier's "Reality" back to our ECS "Data"
                const trans = body.translation();
                const rot = body.rotation();
                console.log(trans);

                c.pos.set(trans.x, trans.y, trans.z);
                c.rot.set(rot.x, rot.y, rot.z, rot.w);
            }
        }
    }

}