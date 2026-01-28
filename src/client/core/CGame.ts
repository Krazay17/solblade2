import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { World } from "#/common/core/World";
import { CNet } from "./CNet";
import { ViewSystem } from "../modules/view/ViewSystem";
import { ControllerType, EntityTypes, SOL_PHYS } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { PhysicsComp } from "#/common/modules";
import { CameraSystem } from "../modules/camera/CameraSystem";
import { AnimationSystem } from "../modules/animation/AnimationSystem";
import { CameraArm } from "../modules/camera/CameraArm";
import { solDebug } from "../debug/DebugDom";
import { ClientSyncSystem } from "../modules/netsync/ClientSyncSystem";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { InputSystem } from "../../common/modules/user/InputSystem";
import { UserComp } from "#/common/modules/user/UserComp";
import type { LocalInput } from "./LocalInput";
import { ViewComp } from "../modules/view/ViewComp";

export class CGame {
    loop: ClientLoop;
    world: World;
    localUser: UserComp;
    tempVec = new SolVec3();

    constructor(private localInput: LocalInput, private rendering: Rendering, private net: CNet) {
        this.loop = new ClientLoop(this);
        this.localUser = new UserComp();

        const cameraArm = new CameraArm();
        this.world = new World(false, [
            new ClientSyncSystem(net, this.localUser),
            new AnimationSystem(),
            new CameraSystem(rendering, cameraArm),
            new ViewSystem(rendering, rendering.scene),
        ]);
        this.world.addSingleton(localInput, rendering, net,
            cameraArm,
        );
    }

    async run() {
        await this.rendering.loadMap("World0");
        await this.world.start();
        // for (let i = 0; i < 5; i++) {
        //     const id = this.world.spawn(undefined, EntityTypes.wizard, {
        //         TransformComp: {
        //             pos: new SolVec3(0, i + i + 2, 0)
        //         },
        //         PhysicsComp: {
        //             ControllerType: ControllerType.LOCAL_PLAYER
        //         }
        //     })
        // }
        this.localStart();
        this.loop.start();
    }

    localStart() {
        const userId = this.world.spawn();
        const user = this.world.add(userId, this.localUser);
        user.socketId = "LOCAL_USER";
        const pawnId = this.world.spawn(undefined, EntityTypes.player, {
            TransformComp: {
                pos: new SolVec3(2, 2, 0)
            }
        })
        user.pawnId = pawnId;
        this.world.addSingleton(user);

    }

    preUpdate(dt: number, time: number) {
        this.world.preUpdate(dt, time);
    }

    step(dt: number, time: number) {
        this.world.preStep(dt, time);
        this.world.step(dt, time);
        this.world.postStep(dt, time);
        this.debugTick();
    }

    noRecoveryStep() {
        //this.clientSync.noRecoveryStep(this.world);
    }

    postUpdate(dt: number, time: number) {
        const alpha = this.loop.accum / SOL_PHYS.TIMESTEP;
        this.world.postUpdate(dt, time, alpha);
        this.rendering.render(dt);
    }

    debugTick() {
        const localUser = this.world.getSingleton(UserComp);
        if (!localUser.pawnId) return;
        const pos = this.world.get(localUser.pawnId, TransformComp);
        const phys = this.world.get(localUser.pawnId, PhysicsComp);
        if (pos && phys && phys.body) solDebug.add("LocalEntity",
            `User Id:${localUser.entityId}
            Pawn Id:${localUser.pawnId}
            vel: ${Math.floor(SolVec3.mag(phys.body.linvel()))} 
            pos: x:${Math.floor(pos!.pos.x)} y:${Math.floor(pos!.pos.y)} z:${Math.floor(pos!.pos.z)}
            dynamic: ${phys.body.isDynamic()} Sleep: ${phys.body.isSleeping()}`);
    }

}