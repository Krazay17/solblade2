import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { World } from "@/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "../modules/ViewSystem";
import { SOL_PHYS } from "@/common/core/SolConstants";
import { SolVec3 } from "@/common/core/SolMath";
import { InputSystem } from "@/common/systems/input/InputSystem";
import { HardwareInput } from "@/common/systems/input/HardwareInput";

export class CGame {
    loop: ClientLoop;
    rendering: Rendering;
    world: World;
    inputSystem: InputSystem;
    viewSystem: ViewSystem;
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
        this.viewSystem = new ViewSystem(this.rendering.scene, this.rendering);
        this.inputSystem = new InputSystem(new HardwareInput(), this.canvas);

        this.world = new World(true, this.viewSystem);
    }
    async run() {
        this.rendering.loadMap("World0");
        await this.world.start();

        this.loop.start();
    }

    preTick(dt: number, time: number) {
        this.inputSystem.preTick(this.world, dt);
    }

    step(dt: number, time: number) {
        this.world.step(dt, time);
        this.inputSystem.clearPressed();
    }

    postTick(dt: number, time: number) {
        const alpha = this.loop.accum / SOL_PHYS.TIMESTEP;
        this.viewSystem.postTick(this.world, alpha);

        this.rendering.render(dt);
    }
}