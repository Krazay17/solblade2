import type { ISystem } from "#/common/core/ECS";
import { Comps } from "#/common/core/ECSRegi";
import type { World } from "#/common/core/World";

export class TransformSystem implements ISystem {
    preStep(world: World, dt: number, time: number): void {
        const ids = world.query([Comps.Transform]);
        for (const id of ids) {
            const xform = world.getComp(id, Comps.Transform)!;
            if (!xform.targetPos.empty()) {
                xform.pos.lerp(xform.targetPos, .1);
                const phys = world.getComp(id, Comps.Physics);
                phys?.body?.setTranslation(xform.pos, true);
            }
            xform.lastPos.copy(xform.pos);
            xform.lastQuat.copy(xform.quat);
        }
    }
    postStep(world: World, dt: number, time: number): void {
        const ids = world.query([Comps.Transform]);
        for (const id of ids) {
            const xform = world.getComp(id, Comps.Transform)!;
            const phys = world.getComp(id, Comps.Physics);

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