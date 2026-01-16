import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { PlayerController } from "../input/PlayerController";
import { World } from "@/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "../systems/view/ViewSystem";
import { SOL_PHYS } from "@/common/core/SolConstants";

export class CGame {
    loop: ClientLoop;
    rendering?: Rendering;
    world?: World;
    controller?: PlayerController;
    viewSystem?: ViewSystem;
    constructor(private canvas: HTMLElement, private net: CNet) {
        if (!this.canvas) {
            this.canvas = document.createElement("canvas");
            this.canvas.id = "game";
            this.canvas.style.pointerEvents = "all";
            this.canvas.style.zIndex = "1";
            document.appendChild(this.canvas);
        }
        this.loop = new ClientLoop(this);
        this.world = new World(true);
        this.rendering = new Rendering(this.canvas);
        this.controller = new PlayerController(this.canvas, this.rendering);
        this.viewSystem = new ViewSystem(this.rendering.scene, this.rendering);
    }
    async run() {

        this.loop.start();
    }
    preTick(dt: number, time: number) {
        if (!this.world || !this.controller) return;
        const player = this.controller.playerActor;
        if (player && player.movement) {
            this.controller.updatePlayerMovement(player.movement);
        }

        this.world.tick(dt, time);
    }
    step(dt: number, time: number) {
        this.world?.step(dt, time);
    }
    postTick(dt: number, time: number) {
        if (!this.world) return;
        const alpha = this.loop.accum / SOL_PHYS.TIMESTEP;
        this.controller!.tick(dt, time);
        this.viewSystem!.postTick(this.world, alpha);

        this.rendering?.render(dt);
    }
}