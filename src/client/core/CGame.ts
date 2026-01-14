import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { PlayerController } from "../input/PlayerController";
import { World } from "@/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "./ViewSystem";
import { ControllerType } from "@/common/actor/Actor";

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

        for (let i = 0; i < 2200; ++i) {
            this.world?.spawn({ type: "cube", pos: [0, i * i+2, 0] }, ControllerType.LOCAL_PLAYER);
        }
        this.loop.start();
    }
    tick(dt: number, time: number) {
        if (!this.world) return;
        this.controller?.tick(dt, time);
        this.world.tick(dt, time);
        this.viewSystem?.sync(this.world.actors);
        this.rendering?.render(dt);
    }
    step(dt: number, time: number) {
        this.world?.step(dt, time);
    }
}