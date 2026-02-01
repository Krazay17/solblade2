import { AbilityState } from "#/common/core/ECS";
import type { World } from "#/common/core/World";
import { AbilityComp } from "./AbilityComp";
import { MovementComp } from "../movement/MovementComp";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { UserComp } from "../controller/UserComp";
import { Comps } from "#/common/core/ECSRegi";

export class FireballState extends AbilityState {
    canEnter(world: World, id: number): boolean {
        return true;
    }
    canExit(world: World, id: number): boolean {
        return true;
    }
    enter(world: World, id: number, ability: AbilityComp): void {
        const move = world.get(id, MovementComp);
        const user = world.get(id, UserComp);

        ability.duration = 2;
        ability.timer = 0;

        if (move) {
            move.augmentSpeed = 0.33;
        }
        const fireballId = world.spawn(NetworkRole.LOCAL, EntityTypes.fireball, undefined, {
            TransformComp: { pos: new SolVec3(0, 5, 0) }
        });
        const step = user ? user.lastProcessedSeq : world.stepCount;
        world.add(fireballId, Comps.Owner).setOwnerId(id).setStep(step);
    }
    update(world: World, id: number, dt: number, ability: AbilityComp): void {
        ability.timer += dt;
        if (ability.timer >= ability.duration) {
            ability.requestedState = "idle";
        }
    }
}