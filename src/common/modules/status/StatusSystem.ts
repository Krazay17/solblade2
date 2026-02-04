import { Comps, type ISystem } from "#/common/core/ECS";
import type { SolWorld } from "#/common/core/SolWorld";
import { StatusType } from "./StatusComp";

export class StatusSystem implements ISystem {
    preStep(world: SolWorld, dt: number, time: number): void {
        const ids = world.query([Comps.Status]);

        for (const id of ids) {
            const status = world.get(id, Comps.Status)!;
            let flags = StatusType.NONE;

            for (const [bit, effect] of status.activeEffects) {
                effect.duration -= dt;
                if (effect.duration <= 0) {
                    status.activeEffects.delete(bit);
                    if (status.activeEffects.size <= 0) {
                        world.removeComponent(id, Comps.Status);
                    }
                }
                else {
                    flags |= bit;
                    if (bit === StatusType.BURN) {
                        const vitals = world.get(id, Comps.Vitals);
                        if (vitals) vitals.health -= effect.damage! * dt;
                    }
                }
            }
            status.flags = flags;
        }
    }
    // applyStun(world: SolWorld, id: number, duration: number) {
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

export function applyStun(world: SolWorld, id: number, duration: number) {
    const type = StatusType.STUN;
    const status = world.add(id, Comps.Status);
    const existing = status.activeEffects.get(StatusType.STUN);
    if (existing) {
        existing.duration = Math.max(existing.duration, duration);
    } else {
        status.activeEffects.set(type, { type, duration });
    }
    return status;
}