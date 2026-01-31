import { Rendering } from "#/client/core/Rendering";
import type { ISystem } from "#/common/core/ECS";
import { Comps } from "#/common/core/ECSRegi";
import { SolVec3 } from "#/common/core/SolMath";
import type { World } from "#/common/core/World";

export class NameplateSystem implements ISystem {
    private _prev = new SolVec3();
    private _next = new SolVec3();
    postUpdate(world: World, dt: number, time: number, alpha: number): void {
        const ids = world.query([Comps.Nameplate]);
        for (const id of ids) {
            const nameplate = world.getComp(id, Comps.Nameplate)!;
            const xform = world.getComp(id, Comps.Transform);
            const rendering = world.getSingleton(Rendering);
            const owner = world.getComp(id, Comps.Owner);

            if (!nameplate.inScene) {
                rendering.scene.add(nameplate.sprite);
                nameplate.inScene = true;
            }
            nameplate.updateText(String(owner?.ownerId));
            if (!xform) continue;
            this._prev.copy(xform.lastPos).add(nameplate.offset);
            this._next.copy(xform.pos).add(nameplate.offset);
            nameplate.sprite.position.lerpVectors(this._prev, this._next, alpha);
        }
    }
}