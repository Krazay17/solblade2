import { LocalInput } from "#/client/core/LocalInput";
import type { ISystem } from "#/common/core/ECS";
import { Actions } from "#/common/core/SolConstants";
import type { SolVec3 } from "#/common/core/SolMath";
import { type World } from "#/common/core/World";
import { MovementComp } from "#/common/modules";
import { AbilityComp } from "#/common/modules/ability/AbilityComp";
import { calculateNextId } from "#/common/modules/user/PossessUtils";
import { UserComp } from "#/common/modules/user/UserComp";

export class InputSystem implements ISystem {
    constructor() { }
    preStep(world: World): void {
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
                localUser.inputBuffer.shift();
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
        if (user.inputBuffer.length === 0) {
            // OPTIONAL: Clear "pressed" flags so actions don't repeat
            user.actions.pressed = 0;
            return;
        }

        // 2. We have data, so now we safely shift it
        const nextInput = user.inputBuffer.shift();

        if (nextInput) {
            const prevHeld = user.actions.held;
            user.actions.held = nextInput.mask;
            user.actions.pressed = user.actions.held & ~prevHeld;
            user.yaw = nextInput.yaw;
            user.pitch = nextInput.pitch;
            user.lastProcessedSeq = nextInput.seq;
        }
    }

    private applyUserToPawn(world: World, user: UserComp) {
        if (!user.pawnId) return;
        const move = world.get(user.pawnId, MovementComp);
        const ability = world.get(user.pawnId, AbilityComp);

        if (move) {
            move.yaw = user.yaw;
            move.pitch = user.pitch;
            calcDir(move.wishdir, user.actions.held, user.yaw);
            if (user.actions.pressed & Actions.JUMP) {
                move.wantsJump = true;
            }
        }
        if (ability) {
            if (user.actions.held & Actions.ABILITY1) {
                ability.action = Actions.ABILITY1;
            } else if (user.actions.held & Actions.ABILITY2) {
                ability.action = Actions.ABILITY2;
            }
        }

        // Logic for possession/switching entities
        if (user.actions.pressed & (Actions.NEXTE | Actions.LASTE)) {
            const direction = user.actions.pressed & Actions.NEXTE ? 1 : -1;
            const nextId = calculateNextId(world, user.pawnId, direction);
            user.pendingPawnId = nextId;
        }
    }
}

function calcDir(wishdir: SolVec3, heldMask: number, yaw: number) {
    wishdir.set(0, 0, 0);
    const fwd = heldMask & Actions.FWD ? 1 : 0;
    const bwd = heldMask & Actions.BWD ? 1 : 0;
    const left = heldMask & Actions.LEFT ? 1 : 0;
    const right = heldMask & Actions.RIGHT ? 1 : 0;

    const zInput = bwd - fwd;   // -1 is Forward
    const xInput = right - left; // 1 is Right

    if (zInput === 0 && xInput === 0) return;

    // 3. Rotate Direction by Yaw
    // We use Math.sin/cos to rotate our vector manually - it's faster and simpler
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);

    // Standard 2D rotation formula applied to X and Z
    const worldX = xInput * cos + zInput * sin;
    const worldZ = zInput * cos - xInput * sin;

    wishdir.set(worldX, 0, worldZ).normalize();
}