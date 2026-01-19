import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { World } from "@/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "../modules/ViewSystem";
import { SOL_PHYS } from "@/common/core/SolConstants";
import { SolVec3 } from "@/common/core/SolMath";
import { InputSystem } from "@/common/modules";
import { LocalUser } from "@/client/modules/LocalUser";
import { CameraSystem } from "../modules/CameraSystem";
import { PlayerSwapSystem } from "../modules/PlayerSwapSystem";


export class CGame {
    loop: ClientLoop;
    rendering: Rendering;
    world: World;
    inputSystem: InputSystem;
    viewSystem: ViewSystem;
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
        this.loop = new ClientLoop(this);
        this.rendering = new Rendering(this.canvas);
        this.rendering.camera.position.set(0, 0, 5);
        const localUser = new LocalUser();
        this.inputSystem = new InputSystem(localUser, this.canvas);
        this.viewSystem = new ViewSystem(this.rendering.scene, this.rendering);
        this.cameraSystem = new CameraSystem(this.rendering);

        this.world = new World(true, [
            this.viewSystem,
            this.cameraSystem,
            new PlayerSwapSystem()
        ]);

        this.world.addSingleton(localUser);
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
        
        this.rendering.render(dt);
    }
}