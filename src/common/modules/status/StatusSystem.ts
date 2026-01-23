import type { ISystem } from "@/common/core/ECS";
import type { World } from "@/common/core/World";
import { StatusComp, StatusType } from "./StatusComp";
import { VitalsComp } from "../vitals/VitalsComp";

export class StatusSystem implements ISystem {
    preStep(world: World, dt: number, time: number): void {
        const ids = world.query(StatusComp);

        for (const id of ids) {
            const status = world.get(id, StatusComp)!;
            let flags = StatusType.NONE;

            for (const [bit, effect] of status.activeEffects) {
                effect.duration -= dt;
                if (effect.duration <= 0) {
                    status.activeEffects.delete(bit);
                    if (status.activeEffects.size <= 0) {
                        world.removeComponent(id, StatusComp);
                    }
                }
                else {
                    flags |= bit;
                    if (bit === StatusType.BURN) {
                        const vitals = world.get(id, VitalsComp);
                        if (vitals) vitals.health -= effect.damage! * dt;
                    }
                }
            }
            status.flags = flags;
        }
    }
    // applyStun(world: World, id: number, duration: number) {
    //     const type = StatusType.STUN;
    //     const status = world.add(id, StatusComp);
    //     const existing = status.activeEffects.get(StatusType.STUN);
    //     if (existing) {
    //         existing.duration = Math.max(existing.duration, duration);
    //     } else {
    //         status.activeEffects.set(type, { type, duration });
    //     }
    //     return status;
    // }
}

export function applyStun(world: World, id: number, duration: number) {
    const type = StatusType.STUN;
    const status = world.add(id, StatusComp);
    const existing = status.activeEffects.get(StatusType.STUN);
    if (existing) {
        existing.duration = Math.max(existing.duration, duration);
    } else {
        status.activeEffects.set(type, { type, duration });
    }
    return status;
}