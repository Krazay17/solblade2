import { ClientLoop } from "./ClientLoop";
import { Rendering } from "./Rendering";
import { PlayerController } from "../input/PlayerController";
import { World } from "@/common/core/World";
import type { CNet } from "./CNet";
import { ViewSystem } from "../systems/view/ViewSystem";
import { EntityTypes, SOL_PHYS } from "@/common/core/SolConstants";
import { SolVec3 } from "@/common/core/SolMath";
import { TestComp } from "@/common/systems";

export class CGame {
    loop: ClientLoop;
    rendering: Rendering;
    world: World;
    controller: PlayerController;
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
        this.controller = new PlayerController(this.canvas, this.rendering);
        this.viewSystem = new ViewSystem(this.rendering.scene, this.rendering);

        this.world = new World(true, this.viewSystem);
    }
    async run() {
        this.rendering.loadMap("World0");
        await this.world.start();
        for (let i = 0; i < 6000; ++i) {
            const id = this.world.spawn(EntityTypes.box, { PhysicsComp: { pos: this.tempVec.set(0, i + i, 0) } });
            if (i % 2){
                this.world.addComponent(id, new TestComp());
                console.log("mod 2");
            }
        }

        this.loop.start();
    }

    preTick(dt: number, time: number) {
        const player = this.controller.playerActor;
        if (player && player.movement) {
            this.controller.updatePlayerMovement(player.movement);
        }
    }

    step(dt: number, time: number) {
        this.world.step(dt, time);
    }

    postTick(dt: number, time: number) {
        const alpha = this.loop.accum / SOL_PHYS.TIMESTEP;
        this.controller.tick(dt, time);
        this.viewSystem.postTick(this.world, alpha);

        this.rendering.render(dt);
    }
}