import type { ISystem } from "#/common/core/ECS";
import { INTERPOLATION } from "#/common/core/SolConstants";
import type { World } from "#/common/core/World";
import { RemoteComp } from "#/common/modules/network/RemoteComp";


export class ClientCleanupSystem implements ISystem {
    private GHOST_TIMEOUT = 250;
    postUpdate(world: World, dt: number, time: number, alpha: number): void {
        const ids = world.query(RemoteComp);
        const currentRenderTime = Date.now() - INTERPOLATION.OFFSET;
        for (const id of ids){
            const remote = world.get(id, RemoteComp)!;

            if(currentRenderTime - remote.lastSeenServerTime > this.GHOST_TIMEOUT){
                console.log(`reap e: ${id}`);
                world.removeEntity(id);
            }
        }
    }
}