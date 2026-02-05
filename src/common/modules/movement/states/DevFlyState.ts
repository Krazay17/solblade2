import { Comps } from "#/common/core/ECS";
import { SolVec3 } from "#/common/core/SolMath";
import type { SolWorld } from "#/common/core/SolWorld";
import type { MovementComp } from "../MovementComp";
import { MoveState } from "./MoveState";

export class DevFlyState extends MoveState {
    private _tempVec = new SolVec3()
    update(world: SolWorld, id: number, dt: number, move: MovementComp): void {
        const phys = world.get(id, Comps.Physics);
        this._tempVec.copy(phys?.body?.translation()).add(move.getAim());
        phys?.body?.setTranslation(this._tempVec, true);
    }
}