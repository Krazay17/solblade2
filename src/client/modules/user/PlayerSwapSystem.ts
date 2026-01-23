import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { LocalUser } from "./LocalUser";
import { Actions } from "#/common/core/SolConstants";

export class PlayerSwapSystem implements ISystem {
    preUpdate(world: World, dt: number, time: number): void {
        const localUser = world.getSingleton(LocalUser);
        if (localUser.actions.pressed.has(Actions.NEXTE)) {
            localUser.entityId += 1;
            if (localUser.entityId > world.entities.size) localUser.entityId = world.entities.size;
        }
        if (localUser.actions.pressed.has(Actions.LASTE)) {
            localUser.entityId -= 1;
            if (localUser.entityId < world.entities.size) localUser.entityId = 0;
        }
    }
}