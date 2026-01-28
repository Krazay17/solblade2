import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { PhysicsComp } from "./PhysicsComp";
import RAPIER from "@dimforge/rapier3d-compat";
import { createBody } from "#/common/core/PhysicsFactory";
import { SOL_PHYS } from "#/common/core/SolConstants";
import { TransformComp } from "../transform/TransformComp";
import { AuthorityComp } from "../network/AuthorityComp";
import { LocalComp } from "../network/LocalComp";

export class PhysicsSystem implements ISystem {
    constructor(private physWorld: RAPIER.World) { }
    step(world: World): void {
        const ids = world.query(PhysicsComp);

        for (const id of ids) {
            const phys = world.get(id, PhysicsComp)!;
            const xform = world.get(id, TransformComp);
            const auth = world.has(id, AuthorityComp) || world.has(id, LocalComp);
            const rb = phys.body;

            if (!rb) {
                if (phys.makingBody) continue;
                phys.makingBody = true;
                const { body } = createBody(this.physWorld, phys, xform, auth);
                if (body) {
                    phys.body = body;
                    body.userData = { entityId: id };
                }
                continue;
            }
            if (rb.isDynamic()) {
                const vel = rb.linvel();
                const sqMag = vel.x * vel.x + vel.y * vel.y + vel.z * vel.z;

                if (sqMag > SOL_PHYS.TERMINAL_VELOCITY_SQ) {
                    const scale = SOL_PHYS.TERMINAL_VELOCITY / Math.sqrt(sqMag);

                    vel.x *= scale;
                    vel.y *= scale;
                    vel.z *= scale;

                    rb.setLinvel(vel, true);
                }
            } else {
                if (xform) rb.setNextKinematicTranslation(xform.pos);
            }

        }

        this.physWorld.step();
    }
    removeEntity(world: World, entityId: number) {
        const comp = world.get(entityId, PhysicsComp);
        if (comp && comp.body) {
            this.physWorld.removeRigidBody(comp.body);
        }
    }
}