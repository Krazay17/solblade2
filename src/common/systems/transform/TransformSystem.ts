import type { World } from "@/common/core/World";
import type { ISystem } from "../System";
import { TransformComp } from "./TransformComp";
import RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init();

export class TransformSystem implements ISystem {
    private components: TransformComp[] = [];

    update(world: World, dt: number): void {
        this.preStep();
    }

    preStep() {
        for (const c of this.components) {
            c.lastPos.copy(c.pos);
            c.lastRot.copy(c.rot);
        }
    }

}