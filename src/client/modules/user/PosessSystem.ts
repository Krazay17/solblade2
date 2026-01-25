import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { LocalUser } from "./LocalUser";
import { Actions, ControllerType } from "#/common/core/SolConstants";
import { PhysicsComp } from "#/common/modules";
import RAPIER from "@dimforge/rapier3d-compat";
import { NetsyncComp } from "#/common/modules/netsync/NetsyncComp";
import { resolveCollisionGroup } from "#/common/core/PhysicsFactory";

export class PosessSystem implements ISystem {
    preStep(world: World, dt: number, time: number): void {
        const localUser = world.getSingleton(LocalUser);
        const isNext = localUser.actions.pressed.has(Actions.NEXTE);
        const isLast = localUser.actions.pressed.has(Actions.LASTE);

        if (isNext || isLast) {
            // 1. Get a list of all entities that HAVE physics (the ones we can possess)
            const available = world.query(PhysicsComp);
            if (available.length === 0) return;

            // 2. Find where we are currently in that list
            let currentIndex = available.indexOf(localUser.entityId);

            // 3. Calculate next index (with wrapping)
            let nextIndex = 0;
            if (isNext) {
                nextIndex = (currentIndex + 1) % available.length;
            } else {
                nextIndex = (currentIndex - 1 + available.length) % available.length;
            }

            this.posessEntity(world, available[nextIndex], localUser);
        }

    }

    posessEntity(world: World, id: number, user: LocalUser) {
        if (!world.entities.has(id)) return;

        if (user.entityId !== undefined) {
            const oldPhys = world.get(user.entityId, PhysicsComp);
            if (oldPhys?.body) {
                oldPhys.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
            }

        };

        user.entityId = id;
        const phys = world.get(id, PhysicsComp)!;
        const net = world.get(id, NetsyncComp);
        if (net) {
            net.controllerType = ControllerType.LOCAL_PLAYER;
        }
        if (phys.body) {
            phys.body.setBodyType(RAPIER.RigidBodyType.Dynamic, false);
            phys.body.sleep();
            phys.body.wakeUp();
            const collider = phys.body.collider(0);
            if (collider) {
                const newGroup = resolveCollisionGroup("pawn", ControllerType.LOCAL_PLAYER);
                if (newGroup) collider.setCollisionGroups(newGroup);
            }
        }
    }
}