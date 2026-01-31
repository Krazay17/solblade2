import { Comps } from "#/common/core/ECSRegi";
import { type World } from "#/common/core/World";

export function calculateNextId(world: World, prevId: number = -1, direction: number) {
    const available = world.query([Comps.Movement]);
    const currentIdx = available.indexOf(prevId);

    // Calculate next index with wrap-around safety
    const nextIdx = (currentIdx + direction + available.length) % available.length;
    const nextPawnId = available[nextIdx];

    return nextPawnId ?? prevId;
}