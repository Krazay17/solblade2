import { solRender } from "#/client/core/CMain";
import type { ISystem } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { NameplateComp } from "./NameplateComp";

export class NameplateSystem implements ISystem {
    postUpdate(world: World, dt: number, time: number, alpha: number): void {
        const ids = world.query(NameplateComp);
        for (const id of ids) {
            const nameplate = world.get(id, NameplateComp)!;
            const xform = world.get(id, TransformComp);
            if (!nameplate.inScene) {
                nameplate.inScene = true;
                solRender.scene.add(nameplate.canvas)
            }
            if (!xform) continue;
            nameplate.canvas.position.lerpVectors(xform.lastPos, xform.pos, alpha);
        }
    }
}