import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { World } from "#/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "../modules/view/ViewSystem";
import { EntityTypes, SOL_PHYS } from "#/common/core/SolConstants";
import { SolVec3 } from "#/common/core/SolMath";
import { InputSystem, PhysicsComp } from "#/common/modules";
import { LocalUser } from "#/client/modules/user/LocalUser";
import { CameraSystem } from "../modules/camera/CameraSystem";
import { PosessSystem } from "../modules/user/PosessSystem";
import { AnimationSystem } from "../modules/animation/AnimationSystem";
import { CameraArm } from "../modules/camera/CameraArm";
import { solDebug } from "../debug/DebugDom";
import { ClientSyncSystem } from "../modules/netsync/ClientSyncSystem";
import { TransformComp } from "#/common/modules/transform/TransformComp";


export class CGame {
    loop: ClientLoop;
    rendering: Rendering;
    world: World;
    inputSystem: InputSystem;
    viewSystem: ViewSystem;
    animationSystem: AnimationSystem;
    cameraSystem: CameraSystem;
    localUser: LocalUser;
    cameraArm: CameraArm;
    clientSync: ClientSyncSystem;

    tempVec = new SolVec3();

    constructor(private canvas: HTMLElement, private net: CNet) {
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = "game";
            this.canvas.style.pointerEvents = "all";
            this.canvas.style.zIndex = "1";
            document.appendChild(this.canvas);
        }
        this.clientSync = new ClientSyncSystem(this.net);

        this.localUser = new LocalUser();
        this.cameraArm = new CameraArm();


        this.loop = new ClientLoop(this);
        this.rendering = new Rendering(this.canvas);
        this.rendering.camera.position.set(0, 0, 5);
        this.inputSystem = new InputSystem(this.localUser, this.canvas);

        this.animationSystem = new AnimationSystem();
        this.cameraSystem = new CameraSystem(this.rendering, this.cameraArm);
        this.viewSystem = new ViewSystem(this.rendering.scene, this.rendering);

        this.world = new World(false, [
            new PosessSystem(),
            this.clientSync,
            this.animationSystem,
            this.cameraSystem,
            this.viewSystem,
        ]);

        this.world.addSingleton(this.localUser);
        this.world.addSingleton(this.rendering);
        this.world.addSingleton(this.cameraArm);

    }

    async run() {
        await this.rendering.loadMap("World0");
        await this.world.start()

        this.world.spawn(EntityTypes.wizard, { TransformComp: { pos: new SolVec3(0, 5, 0) } })

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