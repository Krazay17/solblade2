import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { World } from "@/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "../modules/view/ViewSystem";
import { SOL_PHYS } from "@/common/core/SolConstants";
import { SolVec3 } from "@/common/core/SolMath";
import { InputSystem, PhysicsComp } from "@/common/modules";
import { LocalUser } from "@/client/modules/user/LocalUser";
import { CameraSystem } from "../modules/camera/CameraSystem";
import { PlayerSwapSystem } from "../modules/user/PlayerSwapSystem";
import { AnimationSystem } from "../modules/animation/AnimationSystem";
import { CameraArm } from "../modules/camera/CameraArm";
import { solDebug } from "../debug/DebugDom";


export class CGame {
    loop: ClientLoop;
    rendering: Rendering;
    world: World;
    inputSystem: InputSystem;
    viewSystem: ViewSystem;
    animationSystem: AnimationSystem;
    cameraSystem: CameraSystem;
    tempVec = new SolVec3();

    constructor(private canvas: HTMLElement, private net: CNet) {
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = "game";
            this.canvas.style.pointerEvents = "all";
            this.canvas.style.zIndex = "1";
            document.appendChild(this.canvas);
        }

        const localUser = new LocalUser();
        const cameraArm = new CameraArm();

        
        this.loop = new ClientLoop(this);
        this.rendering = new Rendering(this.canvas);
        this.rendering.camera.position.set(0, 0, 5);
        this.inputSystem = new InputSystem(localUser, this.canvas);
        this.viewSystem = new ViewSystem(this.rendering.scene, this.rendering);
        this.cameraSystem = new CameraSystem(this.rendering, cameraArm);
        this.animationSystem = new AnimationSystem();

        this.world = new World(true, [
            this.viewSystem,
            this.cameraSystem,
            this.animationSystem,
            new PlayerSwapSystem()
        ]);

        this.world.addSingleton(localUser);
        this.world.addSingleton(this.rendering);
        this.world.addSingleton(cameraArm);
    }

    async run() {
        this.rendering.loadMap("World0");
        await this.world.start();

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
    }

    postUpdate(dt: number, time: number) {
        const alpha = this.loop.accum / SOL_PHYS.TIMESTEP;

        this.world.postUpdate(dt, time, alpha);

        const pos = this.world.get(0, PhysicsComp);
        if (pos) solDebug.add("Entity0pos", `Entity0 pos: x:${Math.floor(pos!.pos.x)} y:${Math.floor(pos!.pos.y)} z:${Math.floor(pos!.pos.z)}`);

        this.rendering.render(dt);
    }
}