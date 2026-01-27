import { type World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { ControllerType } from "#/common/core/SolConstants";
import { PhysicsComp } from "#/common/modules";
import RAPIER from "@dimforge/rapier3d-compat";
import { NetsyncComp } from "#/common/modules/netsync/NetsyncComp";
import { resolveCollisionGroup } from "#/common/core/PhysicsFactory";
import { UserComp } from "#/common/modules/user/UserComp";

export class PossessSystem implements ISystem {
    preStep(world: World): void {
        for (const id of world.query(UserComp)) {
            const user = world.get(id, UserComp)!;

            if (user.pendingPawnId === null) continue;

            const newPawnId = user.pendingPawnId;
            const oldPawnId = user.pawnId;

            // 1. Handle the OLD body (Transition to AI or Idle)
            if (oldPawnId !== null && world.entities.has(oldPawnId)) {
                this.setEntityControlState(world, oldPawnId, ControllerType.AI);
            }

            // 2. Handle the NEW body
            if (world.entities.has(newPawnId)) {
                // Check if this is "us" to determine Local vs Remote control
                const isLocal = !world.isServer && user === world.getSingleton(UserComp);
                const controlType = isLocal ? ControllerType.LOCAL_PLAYER : ControllerType.REMOTE_PLAYER;

                this.setEntityControlState(world, newPawnId, controlType);
                user.pawnId = newPawnId;
            }

            // 3. Clear the request
            user.pendingPawnId = null;
        }
    }

    private setEntityControlState(world: World, idPawn: number, type: ControllerType) {
        const phys = world.get(idPawn, PhysicsComp);
        const net = world.get(idPawn, NetsyncComp);

        if (net) net.controllerType = type;

        // Only the "Owner" of the physics (Server or Local-Only) should mutate Rapier bodies
        const isAuth = world.isServer || type === ControllerType.LOCAL_PLAYER;

        if (isAuth && phys?.body) {
            const isDynamic = type === ControllerType.LOCAL_PLAYER || type === ControllerType.REMOTE_PLAYER;

            phys.body.setBodyType(
                isDynamic ? RAPIER.RigidBodyType.Dynamic : RAPIER.RigidBodyType.KinematicPositionBased,
                true
            );

            phys.body.wakeUp();

            const collider = phys.body.collider(0);
            if (collider) {
                const group = resolveCollisionGroup("pawn", type);
                if (group) collider.setCollisionGroups(group);
            }
        }
    }
}