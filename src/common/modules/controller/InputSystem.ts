import { LocalInput } from "#/client/core/LocalInput";
import { Comps, type ISystem } from "#/common/core/ECS";
import { Actions } from "#/common/core/SolConstants";
import type { SolVec3 } from "#/common/core/SolMath";
import { type World } from "#/common/core/World";
import { UserComp } from "#/common/modules/controller/UserComp";

export class InputSystem implements ISystem {
    constructor() { }
    preStep(world: World): void {
        if (!world.isServer) this.handleLocalInput(world);

        for (const id of world.query([Comps.User])) {
            const user = world.get(id, Comps.User)!;
            if (world.isServer) this.processServerInput(user);
            this.applyUserToPawn(world, user);
        }
    }
    private handleLocalInput(world: World) {
        const localUser = world.get(world.localId, Comps.User);
        if (!localUser) return;
        const localInput = world.getSingleton(LocalInput);

        const prevHeld = localUser.actions.held;
        localUser.actions.held = localInput.heldMask;
        localUser.actions.pressed = localUser.actions.held & ~prevHeld;
        localUser.yaw = localInput.yaw;
        localUser.pitch = localInput.pitch;

        localUser.inputBuffer.push({
            seq: world.stepCount,
            mask: localUser.actions.held,
            yaw: localUser.yaw,
            pitch: localUser.pitch
        });

        // Safety cap to prevent memory leaks if disconnected
        if (localUser.inputBuffer.length > 200) {
            localUser.inputBuffer.shift();
        }
    }
    private processServerInput(user: UserComp) {
        if (user.inputBuffer.length === 0) {
            user.actions.pressed = 0;
            return;
        }
        const nextInput = user.inputBuffer.shift()!;

        const prevHeld = user.actions.held;
        user.actions.held = nextInput.mask;
        user.actions.pressed = user.actions.held & ~prevHeld;
        user.yaw = nextInput.yaw;
        user.pitch = nextInput.pitch;
        user.lastProcessedSeq = nextInput.seq;
    }

    private applyUserToPawn(world: World, user: UserComp) {
        if (!user.pawnId) return;
        const move = world.get(user.pawnId, Comps.Movement);
        const ability = world.get(user.pawnId, Comps.Ability);

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
        if (user.actions.pressed & (Actions.NEXTE | Actions.LASTE)) {
            const direction = user.actions.pressed & Actions.NEXTE ? 1 : -1;
            user.changePawn = direction;
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

    const worldX = xInput * cos + zInput * sin;
    const worldZ = zInput * cos - xInput * sin;

    wishdir.set(worldX, 0, worldZ).normalize();
}