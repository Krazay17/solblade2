import type { SolWorld } from "#/common/core/SolWorld";
import  {Comps, type ISystem } from "#/common/core/ECS"
import RAPIER from "@dimforge/rapier3d-compat";
import { createBody } from "#/common/core/PhysicsFactory";
import { SOL_PHYS } from "#/common/core/SolConstants";

export class PhysicsSystem implements ISystem {
    constructor(private physWorld: RAPIER.World) { }
    step(world: SolWorld): void {
        const ids = world.query([Comps.Physics]);

        for (const id of ids) {
            const phys = world.get(id, Comps.Physics)!;
            const xform = world.get(id, Comps.Transform);
            const auth = world.has(id, [Comps.Authority]) || world.has(id, [Comps.Local]);
            const rb = phys.body;

            if (!rb) {
                if (phys.makingBody) continue;
                phys.makingBody = true;
                const { body } = createBody(this.physWorld, phys, xform, auth);
                if (body) {
                    phys.body = body;
                    phys.handle = body.handle;
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
    removeEntity(world: SolWorld, entityId: number) {
        const comp = world.get(entityId, Comps.Physics);
        if (comp && comp.body) {
            this.physWorld.removeRigidBody(comp.body);
        }
    }
}