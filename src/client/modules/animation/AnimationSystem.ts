import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/core/ECS"
import { AnimationComp } from "./AnimationComp";
import { ViewComp } from "@/common/modules";
import { STModel } from "../view/STModel";

export class AnimationSystem implements ISystem {
    // or map models here? but then I would need to handle removal/cleanup?
    postUpdate(world: World, dt: number, time: number, alpha: number): void {
        const ids = world.query(AnimationComp, ViewComp);
        const slModel = world.getSingleton(STModel);

        for (const id of ids) {
            const view = world.get(id, ViewComp)!;
            const modelState = slModel.modelMap.get(id);

            if (!modelState || !modelState.anims || !modelState.mixer) continue;

            // 1. Tell the model which animation the DATA wants to see
            if (view.animation && modelState.anims[view.animation]) {
                modelState.play(view.animation);
            }

            // 2. Advance the time for the mixer
            modelState.mixer.update(dt);
        }
    }
}