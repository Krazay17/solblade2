import { LocalInput } from "#/client/core/LocalInput";
import { Comps, type ISystem } from "#/common/core/ECS";
import { Actions } from "#/common/core/SolConstants";
import type { SolVec3 } from "#/common/core/SolMath";
import { type SolWorld } from "#/common/core/SolWorld";
import { UserComp, type TInputBuffer } from "#/common/modules/controller/UserComp";

export class InputSystem implements ISystem {
    preStep(world: SolWorld, dt: number, time: number): void {
        // Local client: sample hardware input into the buffer (server already has inputs in the buffer from network)
        if (!world.isServer) this.sampleLocalInput(world);

        for (const id of world.query([Comps.User])) {
            const user = world.get(id, Comps.User)!;
            this.drainInputBuffer(world, user, dt, time);
            this.applyUserToPawn(world, user);
        }
    }

    private sampleLocalInput(world: SolWorld) {
        const localUser = world.get(world.localId, Comps.User);
        if (!localUser) return;
        const localInput = world.getSingleton(LocalInput);

        localUser.inputBuffer.push({
            seq: world.stepCount,
            mask: localInput.heldMask,
            yaw: localInput.yaw,
            pitch: localInput.pitch,
        });
    }

    private drainInputBuffer(world: SolWorld, user: UserComp, dt: number, time: number) {
        let prevHeld = user.actions.held;

        // Catch-up: process all but the last input with a full sim step
        while (user.inputBuffer.length > 1) {
            const input = user.inputBuffer.shift()!;
            this.applyInput(input, prevHeld, user);
            this.applyUserToPawn(world, user);

            if (world.isServer && user.pawnId) {
                world.processEntity(user.pawnId, dt, time);
            }

            prevHeld = input.mask;
        }

        // Last input: apply but let the normal step handle simulation
        const lastInput = user.inputBuffer.shift();
        if (!lastInput) return;
        this.applyInput(lastInput, prevHeld, user);
    }

    private applyInput(input: TInputBuffer, prevHeld: number, user: UserComp) {
        user.actions.held = input.mask;
        user.actions.pressed = input.mask & ~prevHeld;
        user.yaw = input.yaw;
        user.pitch = input.pitch;
        user.lastProcessedSeq = input.seq;
    }

    private applyUserToPawn(world: SolWorld, user: UserComp) {
        if (!user.pawnId) return;
        const move = world.get(user.pawnId, Comps.Movement);
        const ability = world.get(user.pawnId, Comps.Ability);
        const interact = world.get(user.pawnId, Comps.Interaction);
        if (move) {
            move.yaw = user.yaw;
            move.pitch = user.pitch;
            calcDir(move.wishdir, user.actions.held, user.yaw);
            if (user.actions.pressed & Actions.JUMP) move.wantsJump = true;
            move.devFly = user.actions.held & Actions.DEVFLY;
        }
        if (ability) {
            if (user.actions.held & Actions.ABILITY1) {
                ability.action = Actions.ABILITY1;
            }
            else if (user.actions.held & Actions.ABILITY2) {
                ability.action = Actions.ABILITY2;
            }
        }
        if (user.actions.pressed & (Actions.NEXTE | Actions.LASTE)) {
            user.changePawn = user.actions.pressed & Actions.NEXTE ? 1 : -1;
        }
        if (interact && user.actions.pressed & Actions.INTERACT) {
            interact.wantsInteract = true;
        }
    }
}

function calcDir(wishdir: SolVec3, heldMask: number, yaw: number) {
    wishdir.set(0, 0, 0);
    const fwd = heldMask & Actions.FWD ? 1 : 0;
    const bwd = heldMask & Actions.BWD ? 1 : 0;
    const left = heldMask & Actions.LEFT ? 1 : 0;
    const right = heldMask & Actions.RIGHT ? 1 : 0;

    const zInput = bwd - fwd;
    const xInput = right - left;
    if (zInput === 0 && xInput === 0) return;

    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    wishdir.set(xInput * cos + zInput * sin, 0, zInput * cos - xInput * sin).normalize();
}