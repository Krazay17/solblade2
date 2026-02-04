import { Rendering } from "#/client/core/Rendering";
import { Comps, type ISystem } from "#/common/core/ECS";
import { SolVec3 } from "#/common/core/SolMath";
import type { SolWorld } from "#/common/core/SolWorld";

export class NameplateSystem implements ISystem {
    private _prev = new SolVec3();
    private _next = new SolVec3();
    postUpdate(world: SolWorld, dt: number, time: number, alpha: number): void {
        const ids = world.query([Comps.Nameplate]);
        for (const id of ids) {
            const nameplate = world.get(id, Comps.Nameplate)!;
            const xform = world.get(id, Comps.Transform);
            const rendering = world.getSingleton(Rendering);
            const owner = world.get(id, Comps.Owner);

            if (!nameplate.inScene) {
                rendering.scene.add(nameplate.sprite);
                nameplate.inScene = true;
            }
            const text = owner ? `P${owner.ownerId}=${id}` : `${id}`
            nameplate.updateText(text);
            if (!xform) continue;
            this._prev.copy(xform.lastPos).add(nameplate.offset);
            this._next.copy(xform.pos).add(nameplate.offset);
            nameplate.sprite.position.lerpVectors(this._prev, this._next, alpha);
        }
    }
    removeEntity(world: SolWorld, id: number): void {
        const nameplate = world.get(id, Comps.Nameplate);
        if (nameplate) {
            const rendering = world.getSingleton(Rendering)
            rendering.scene.remove(nameplate.sprite);
        }
    }
}