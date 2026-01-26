import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { World } from "#/common/core/World";
import { CNet } from "./CNet";
import { ViewSystem } from "../modules/view/ViewSystem";
import { ControllerType, EntityTypes, SOL_PHYS } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { PhysicsComp } from "#/common/modules";
import { LocalUser } from "#/client/modules/user/LocalUser";
import { CameraSystem } from "../modules/camera/CameraSystem";
import { AnimationSystem } from "../modules/animation/AnimationSystem";
import { CameraArm } from "../modules/camera/CameraArm";
import { solDebug } from "../debug/DebugDom";
import { ClientSyncSystem } from "../modules/netsync/ClientSyncSystem";
import { TransformComp } from "#/common/modules/transform/TransformComp";
import { InputSystem } from "../modules/user/InputSystem";

export class CGame {
    loop: ClientLoop;
    inputSystem: InputSystem;
    world: World;
    tempVec = new SolVec3();

    constructor(private localUser: LocalUser, private rendering: Rendering, private net: CNet) {
        this.loop = new ClientLoop(this);
        this.inputSystem = new InputSystem(localUser);
        this.world = new World(false, [
            new ClientSyncSystem(net),
            new AnimationSystem(),
            new CameraSystem(rendering, new CameraArm),
            new ViewSystem(rendering, rendering.scene),
        ]);
        this.world.addSingleton(localUser, rendering, net,
            new CameraArm(),
        );
    }

    async run() {
        await this.rendering.loadMap("World0");
        await this.world.start();
        for (let i = 0; i < 5; i++) {
            this.world.spawn(undefined, EntityTypes.wizard, {
                TransformComp: {
                    pos: new SolVec3(0, i+i + 2, 0)
                },
                PhysicsComp: {
                    ControllerType: ControllerType.LOCAL_PLAYER
                }
            })
        }

        this.loop.start();
    }

    preUpdate(dt: number, time: number) {
        this.inputSystem.preUpdate(this.world, dt, time);
        this.world.preUpdate(dt, time);
    }

    step(dt: number, time: number) {
        this.world.preStep(dt, time);
        this.world.step(dt, time);
        this.world.postStep(dt, time);

        //Debug localUser
        const pos = this.world.get(this.localUser.entityId, TransformComp);
        const phys = this.world.get(this.localUser.entityId, PhysicsComp);
        if (pos && phys && phys.body) solDebug.add("LocalEntity",
            `Entity Id:${this.localUser.entityId}
            velY: ${Math.floor(SolVec3.mag(phys.body.linvel()))} 
            x:${Math.floor(pos!.pos.x)} y:${Math.floor(pos!.pos.y)} z:${Math.floor(pos!.pos.z)}
            physX: ${Math.floor(phys.body.translation().x)}
            physY: ${Math.floor(phys.body.translation().y)}
            physZ: ${Math.floor(phys.body.translation().z)}
            dynamic: ${phys.body.isDynamic()} Sleep: ${phys.body.isSleeping()}`);


    }

    noRecoveryStep() {
        //this.clientSync.noRecoveryStep(this.world);
    }

    postUpdate(dt: number, time: number) {
        const alpha = this.loop.accum / SOL_PHYS.TIMESTEP;

        this.world.postUpdate(dt, time, alpha);

        this.rendering.render(dt);
    }

}