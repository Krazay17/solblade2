import type { World } from "@/common/core/World";
import type { ISystem } from "../System";
import { PhysicsComp } from "../components/PhysicsComp";
import RAPIER from "@dimforge/rapier3d-compat";
import { createBody } from "@/common/core/PhysicsFactory";
import { ControllerType } from "@/common/core/SolConstants";

export class PhysicsSystem implements ISystem {
    constructor(private physWorld: RAPIER.World) { }
    step(world: World, dt: number): void {
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