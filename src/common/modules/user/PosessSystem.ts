import { solUsers, type World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { ControllerType } from "#/common/core/SolConstants";
import { PhysicsComp } from "#/common/modules";
import RAPIER from "@dimforge/rapier3d-compat";
import { NetsyncComp } from "#/common/modules/netsync/NetsyncComp";
import { resolveCollisionGroup } from "#/common/core/PhysicsFactory";
import { UserComp } from "#/common/modules/user/UserComp";

export class PosessSystem implements ISystem {
    preStep(world: World): void {
        // 1. Iterate through pending requests
        for (const [socketId, newPawnId] of solUsers.socketToUserPending) {
            // 2. Find the User Entity (The Ghost)
            const userEntityId = solUsers.socketToUser.get(socketId);
            if (userEntityId === undefined) continue;

            const user = world.get(userEntityId, UserComp);
            if (!user) continue;

            const oldPawnId = user.pawnId;

            // 3. Clean up the OLD body (if it exists)
            if (oldPawnId !== null && world.entities.has(oldPawnId)) {
                this.setEntityControlState(world, oldPawnId, ControllerType.AI);
            }

            // 4. Setup the NEW body
            this.setEntityControlState(world, newPawnId, ControllerType.LOCAL_PLAYER);

            // 5. Update the Ghost's pointer
            user.pawnId = newPawnId;

            // 6. Clear the request
            solUsers.socketToUserPending.delete(socketId);

            console.log(`User ${socketId} possessed entity ${newPawnId}`);
        }
    }

    private setEntityControlState(world: World, id: number, type: ControllerType) {
        const phys = world.get(id, PhysicsComp);
        const net = world.get(id, NetsyncComp);
        if (net) net.controllerType = type;

        if (phys?.body) {
            const isPlayer = type === ControllerType.LOCAL_PLAYER;

            // Swap between Dynamic (Player) and Kinematic (AI/Unpossessed)
            phys.body.setBodyType(
                isPlayer ? RAPIER.RigidBodyType.Dynamic : RAPIER.RigidBodyType.KinematicPositionBased,
                true
            );

            // Wake up to ensure physics engine processes the type change
            phys.body.wakeUp();

            const collider = phys.body.collider(0);
            if (collider) {
                const group = resolveCollisionGroup("pawn", type);
                if (group) collider.setCollisionGroups(group);
            }
        }
    }
}