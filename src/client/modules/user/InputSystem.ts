import type { ISystem } from "#/common/core/ECS";
import { Actions } from "#/common/core/SolConstants";
import type { World } from "#/common/core/World";
import { MovementComp } from "#/common/modules";
import { AbilityComp } from "#/common/modules/ability/AbilityComp";
import type { LocalUser } from "./LocalUser";

export class InputSystem implements ISystem {
    constructor(private localUser: LocalUser) { }
    preUpdate(world: World, dt: number, time: number): void {
        const id = this.localUser.entityId;
        const move = world.get(id, MovementComp);
        const ability = world.get(id, AbilityComp);
        if (move) {
            move.actions.held = this.localUser.actions.held;
            move.yaw = this.localUser.yaw;
            move.pitch = this.localUser.pitch;
        }
        if (ability) {
            if (this.localUser.actions.held & Actions.ABILITY1)
                ability.action = Actions.ABILITY1;
            else if (this.localUser.actions.held & Actions.ABILITY2)
                ability.action = Actions.ABILITY2;
        }
    }
}