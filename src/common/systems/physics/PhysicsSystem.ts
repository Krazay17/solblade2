import type { World } from "@/common/core/World";
import type { ISystem } from "../System";
import type { Component } from "../Component";
import { PhysicsComp } from "./PhysicsComp";
import RAPIER from "@dimforge/rapier3d-compat";
import { createBody } from "@/common/core/PhysicsFactory";
import { ControllerType } from "@/common/core/Actor";

export class PhysicsSystem implements ISystem {
    private components: PhysicsComp[] = [];
    constructor(private physWorld: RAPIER.World) { }
    addComp(comp: Component): void {
        // if (comp instanceof PhysicsComp) {
        //     this.components.push(comp);
        //     const { body } = createBody(this.physWorld, comp, ControllerType.LOCAL_PLAYER);
        //     body.setTranslation(comp.pos, true);
        //     comp.body = body;
        //     body.userData = { entityId: comp.entityId };
        // }
    }
    update(world: World, dt: number): void {
        const ids = world.query(PhysicsComp);
        for (const id of ids) {
            const c = world.get(id, PhysicsComp)!;
            if (!c.body) {
                if (c.makingBody) continue;
                c.makingBody = true;
                const { body } = createBody(this.physWorld, c, ControllerType.LOCAL_PLAYER);
                if (body) {
                    c.body = body;
                    body.userData = { entityId: id };
                }
            } else {
                c.lastPos.copy(c.body.translation());
                c.lastRot.copy(c.body.rotation());
            }

        }
        world.physWorld.step();
    }
    removeEntity(world: World, entityId: number) {
        const comp = world.get(entityId, PhysicsComp);
        if (comp && comp.body) {
            this.physWorld.removeRigidBody(comp.body);
        }
    }
}