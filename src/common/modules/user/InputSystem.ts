import { LocalInput } from "#/client/core/LocalInput";
import type { ISystem } from "#/common/core/ECS";
import { Actions } from "#/common/core/SolConstants";
import { solUsers, type World } from "#/common/core/World";
import { MovementComp } from "#/common/modules";
import { AbilityComp } from "#/common/modules/ability/AbilityComp";
import { calculateNextId } from "#/common/modules/user/PossessUtils";
import { UserComp } from "#/common/modules/user/UserComp";

export class InputSystem implements ISystem {
    constructor() { }
    preUpdate(world: World, dt: number, time: number): void {
        if (!world.isServer) {
            const localInput = world.getSingleton(LocalInput);
            const localUser = world.getSingleton(UserComp); // We'll register the local user as a singleton

            const prevHeld = localUser.actions.held;
            localUser.actions.held = localInput.heldMask;
            localUser.actions.pressed = localUser.actions.held & ~prevHeld;
            localUser.yaw = localInput.yaw;
            localUser.pitch = localInput.pitch;

            // Push to buffer for reconciliation
            localUser.inputBuffer.push({
                seq: world.stepCount,
                mask: localUser.actions.held,
                yaw: localUser.yaw,
                pitch: localUser.pitch
            });
            if (localUser.inputBuffer.length > 50) {
                localUser.inputBuffer.shift()
                const last = localUser.inputBuffer[localUser.inputBuffer.length - 1];
            }
        }

        // Apply Input to Pawn (Both Client and Server)
        // This is where the movement systems get their data
        for (const id of world.query(UserComp)) {
            const user = world.get(id, UserComp)!;

            if (world.isServer) {
                this.processServerInput(user);
            }
            // Apply shared logic: Transfer User state to the Pawn
            this.applyUserToPawn(world, user);
        }
    }
    private processServerInput(user: UserComp) {
        // Pull the oldest input from the buffer (FIFO)
        const nextInput = user.inputBuffer.shift();

        if (nextInput) {
            const prevHeld = user.actions.held;
            user.actions.held = nextInput.mask;
            user.actions.pressed = user.actions.held & ~prevHeld;
            user.yaw = nextInput.yaw;
            user.pitch = nextInput.pitch;
            user.lastProcessedSeq = nextInput.seq;
        }
        // If no input is in the buffer, the user "stands still" 
        // or continues their last held action (depending on your design).
    }

    private applyUserToPawn(world: World, user: UserComp) {
        if (!user.pawnId) return;

        const move = world.get(user.pawnId, MovementComp);
        if (move) {
            move.actions.held = user.actions.held;
            move.yaw = user.yaw;
            move.pitch = user.pitch;
        }

        // Logic for possession/switching entities
        if (user.actions.pressed & (Actions.NEXTE | Actions.LASTE)) {
            const direction = user.actions.pressed & Actions.NEXTE ? 1 : -1;
            const nextId = calculateNextId(world, user.pawnId, direction);
            user.pendingPawnId = nextId;
        }
    }
}