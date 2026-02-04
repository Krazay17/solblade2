import { Comps, type ISystem } from "#/common/core/ECS";
import { INTERPOLATION } from "#/common/core/SolConstants";
import type { SolWorld } from "#/common/core/SolWorld";


export class ClientCleanupSystem implements ISystem {
    private GHOST_TIMEOUT = 250;
    postUpdate(world: SolWorld): void {
        const ids = world.query([Comps.Remote]);
        const currentRenderTime = performance.now() - INTERPOLATION.OFFSET;
        for (const id of ids) {
            const remote = world.get(id, Comps.Remote)!;

            if (currentRenderTime - remote.lastSeen > this.GHOST_TIMEOUT) {
                console.log(`reap e: ${id}`);
                world.removeEntity(id);
            }
        }
    }
}