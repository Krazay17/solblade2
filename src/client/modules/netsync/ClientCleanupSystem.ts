import type { ISystem } from "#/common/core/ECS";
import { Comps } from "#/common/core/ECSRegi";
import { INTERPOLATION } from "#/common/core/SolConstants";
import type { World } from "#/common/core/World";


export class ClientCleanupSystem implements ISystem {
    private GHOST_TIMEOUT = 250;
    postUpdate(world: World, dt: number, time: number, alpha: number): void {
        const ids = world.query([Comps.Remote]);
        const currentRenderTime = Date.now() - INTERPOLATION.OFFSET;
        for (const id of ids){
            const remote = world.getComp(id, Comps.Remote)!;

            if(currentRenderTime - remote.lastSeenServerTime > this.GHOST_TIMEOUT){
                console.log(`reap e: ${id}`);
                world.removeEntity(id);
            }
        }
    }
}