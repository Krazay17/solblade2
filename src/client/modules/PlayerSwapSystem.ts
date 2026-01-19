import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/modules/System";
import { LocalUser } from "./LocalUser";

export class PlayerSwapSystem implements ISystem {
    preUpdate(world: World, dt: number, time: number): void {
        const localUser = world.getSingleton(LocalUser);
        if (localUser.inputsPressed.has("KeyE")) {
            localUser.entityId += 1;
        }
    }
}