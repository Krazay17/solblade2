import type { World } from "#/common/core/World";
import { Comps, type ISystem } from "#/common/core/ECS";

export class AnimationSystem implements ISystem {
    postUpdate(world: World, dt: number): void {
        const ids = world.query([Comps.Animation, Comps.View]);

        for (const id of ids) {
            const view = world.get(id, Comps.View)!;
            const anim = world.get(id, Comps.Animation)!;
            const ability = world.get(id, Comps.Ability);
            const model = view.instance;

            if (!model || !model.mixer || !model.anims) continue;


            // 1. Determine Intent
            let desired = "idle";
            if (ability && ability.state !== "idle") {
                desired = ability.state;
            }

            // 2. State Change Trigger
            if (anim.current !== desired) {
                anim.current = desired;
                const difName = anim.nameMap?.[desired] ?? null;
                if (difName) desired = difName;

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
            anim.seek = model.mixer.time;
        }
    }
}