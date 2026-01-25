import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { PhysicsComp } from "./PhysicsComp";
import RAPIER from "@dimforge/rapier3d-compat";
import { createBody } from "#/common/core/PhysicsFactory";
import { ControllerType, SOL_PHYS } from "#/common/core/SolConstants";
import { NetsyncComp } from "../netsync/NetsyncComp";
import { TransformComp } from "../transform/TransformComp";

export class PhysicsSystem implements ISystem {
    constructor(private physWorld: RAPIER.World) { }
    step(world: World, dt: number): void {
        this.physWorld.step();
        const ids = world.query(PhysicsComp);

        for (const id of ids) {
            const c = world.get(id, PhysicsComp)!;
            const xform = world.get(id, TransformComp)!;
            const rb = c.body;

            if (!rb) {
                if (c.makingBody) continue;
                c.makingBody = true;
                const net = world.get(id, NetsyncComp);
                let controllerType = ControllerType.AI;
                if (net && net.controllerType !== undefined) controllerType = net.controllerType;
                const { body } = createBody(this.physWorld, c, xform, world.isServer, controllerType);
                if (body) {
                    c.body = body;
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
                const xform = world.get(id, TransformComp);
                if (xform) rb.setTranslation(xform.pos, true);
            }

        }

    }
    removeEntity(world: World, entityId: number) {
        const comp = world.get(entityId, PhysicsComp);
        if (comp && comp.body) {
            this.physWorld.removeRigidBody(comp.body);
        }
    }
}