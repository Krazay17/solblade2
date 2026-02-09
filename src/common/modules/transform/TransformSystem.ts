import  {Comps, type ISystem } from "#/common/core/ECS";
import type { SolWorld } from "#/common/core/SolWorld";

export class TransformSystem implements ISystem {
    preStep(world: SolWorld, dt: number, time: number): void {
        const ids = world.query([Comps.Transform]);
        for (const id of ids) {
            const xform = world.get(id, Comps.Transform)!;

            xform.lastPos.copy(xform.pos);
            xform.lastQuat.copy(xform.quat);
        }
    }
    postStep(world: SolWorld, dt: number, time: number): void {
        const ids = world.query([Comps.Transform]);
        for (const id of ids) {
            const xform = world.get(id, Comps.Transform)!;
            const phys = world.get(id, Comps.Physics);

            if (phys && phys.body) {
                xform.pos.copy(phys.body.translation());
                xform.quat.copy(phys.body.rotation());
                if (xform.lastPos.empty()) {
                    xform.lastPos.copy(xform.pos);
                    xform.lastQuat.copy(xform.quat);
                }
            }
        }
    }
}