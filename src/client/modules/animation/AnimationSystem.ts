import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { AnimationComp } from "./AnimationComp";
import { ViewComp } from "../view/ViewComp";
import { AbilityComp } from "#/common/modules/ability/AbilityComp";

export class AnimationSystem implements ISystem {
    postUpdate(world: World, dt: number): void {
        const ids = world.query(AnimationComp, ViewComp);

        for (const id of ids) {
            const view = world.get(id, ViewComp)!;
            const anim = world.get(id, AnimationComp)!;
            const ability = world.get(id, AbilityComp);
            const model = view.instance;

            if (!model || !model.mixer || !model.anims) continue;


            // 1. Determine Intent
            let desired = "idle";
            if (ability && ability.state !== "idle") {
                desired = ability.state;
            }
            const difName = anim.nameMap[desired];
            if (difName) desired = difName;

            // 2. State Change Trigger
            if (anim.currentAnim !== desired) {
                anim.currentAnim = desired;
                if (model.anims[desired]) {
                    model.play(desired, anim.blendTime);
                }
            }

            // 3. Drive the Mixer
            // We set timescale, but we let 'update' handle the time advancement.
            // Only use 'setTime' if you are snapping to a specific network frame.
            model.mixer.timeScale = anim.timescale;
            model.mixer.update(dt);

            // 4. Sync seek time back to the component (useful for networking/UI)
            anim.animSeek = model.mixer.time;
        }
    }
}