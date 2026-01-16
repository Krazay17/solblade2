import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { PlayerController } from "../input/PlayerController";
import { World } from "@/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "./ViewSystem";
import { ControllerType, xForm } from "@/common/core/Actor";

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
        this.world?.loadMap("World0");
        this.rendering?.loadMap("World0");
        const player = await this.world?.spawn({ type: "player", model: "spikeMan" }, new xForm(5, 5, 0), ControllerType.LOCAL_PLAYER);
        if (player) this.controller?.setPlayerActor(player);

        for (let i = 0; i < 1000; ++i) {
            this.world?.spawn({ type: "cube" }, new xForm(0, i + i + 5, 0), ControllerType.LOCAL_PLAYER);
        }
        this.loop.start();
    }
    preTick(dt: number, time: number) {
        if (!this.world || !this.controller) return;
        this.controller.tick(dt, time);
        const player = this.controller.playerActor;
        if (player && player.movement) {
            this.controller.updatePlayerMovement(player.movement);
        }

        this.world.tick(dt, time);
    }
    step(dt: number, time: number) {
        this.world?.step(dt, time);
    }
    postTick(dt: number, time: number){
        if(!this.world) return;
        this.viewSystem?.sync(this.world.actors, dt);
        
        this.rendering?.render(dt);
    }
}