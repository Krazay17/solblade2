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
            const anim = world.get(id, AnimationComp)!;
            const modelState = slModel.modelMap.get(id);

            if (!modelState || !modelState.anims || !modelState.mixer || !modelState.inScene) continue;

            // 1. Tell the model which animation the DATA wants to see
            if (anim.currentAnim && modelState.anims[anim.currentAnim]) {
                modelState.play(anim.currentAnim, anim.blendTime);
                modelState.mixer.timeScale = anim.timescale;
                modelState.mixer.setTime(anim.animSeek);
                anim.prevAnim = anim.currentAnim;
            }

            // 2. Advance the time for the mixer
            modelState.mixer.update(dt);
            anim.animSeek = modelState.mixer.time;
        }
    }
}