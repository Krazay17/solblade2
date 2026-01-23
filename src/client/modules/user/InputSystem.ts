import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/core/ECS"
import type { LocalUser } from "./LocalUser";
import { MovementComp } from "@/common/modules";
import { KeyMap } from "../../core/Controls";
import { Actions } from "@/common/core/SolConstants";
import { SolVec3 } from "@/common/core/SolMath";
import { AbilityComp } from "@/common/modules/ability/AbilityComp";


export class InputSystem implements ISystem {
    pointerLocked = false;
    private pressBuffer = new Set<Actions>();
    _tempForward = new SolVec3();
    _tempRight = new SolVec3();
    _tempDir = new SolVec3();
    constructor(private localUser: LocalUser, private gameCanvas: HTMLElement) {
        this.gameCanvas.addEventListener("mousedown", (e) => { this.gameClick(e, true) });
        this.gameCanvas.addEventListener("mouseup", (e) => { this.gameClick(e, false) });
        window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        window.addEventListener("keydown", (e) => this.handleKey(e, true));
        window.addEventListener("keyup", (e) => this.handleKey(e, false));

        document.addEventListener("pointerlockchange", () => {
            if (document.pointerLockElement === this.gameCanvas) this.pointerLocked = true;
            else this.pointerLocked = false;
        });
    }

    handleMouseMove(event: MouseEvent) {
        if (!this.pointerLocked) return;
        if (Math.abs(event.movementX) > 500 || Math.abs(event.movementY) > 500) return;
        const TWO_PI = Math.PI * 2;
        const HALF_PI = Math.PI / 2 - 0.01;
        this.localUser.yaw -= event.movementX * this.localUser.sensitivity;
        this.localUser.pitch -= event.movementY * this.localUser.sensitivity;

        this.localUser.yaw = ((this.localUser.yaw % TWO_PI) + TWO_PI) % TWO_PI;
        this.localUser.pitch = Math.max(-HALF_PI, Math.min(HALF_PI, this.localUser.pitch));
    }

    gameClick(e: MouseEvent, b: boolean) {
        if (!this.pointerLocked) {
            this.gameCanvas.requestPointerLock();
            return;
        }
        const action = KeyMap[String(e.button)];

        if (b) {
            this.pressBuffer.add(action);
            this.localUser.actions.held.add(action);
        } else this.localUser.actions.held.delete(action);

    }

    handleKey(e: KeyboardEvent, b: boolean) {
        if (b && e.repeat) return;
        const action = KeyMap[e.code];
        if (b) {
            this.pressBuffer.add(action);
            this.localUser.actions.held.add(action)
        } else this.localUser.actions.held.delete(action);
    }

    preUpdate(world: World, dt: number, time: number): void {
        // 1. Wipe the state from the PREVIOUS frame
        this.localUser.actions.pressed.clear();
        if (this.pressBuffer.size > 0) {
            for (const action of this.pressBuffer) {
                this.localUser.actions.pressed.add(action);
            }
            this.pressBuffer.clear();
        }

        if (this.localUser.entityId === -1) return;

        const moveComp = world.get(this.localUser.entityId, MovementComp);
        const abilityComp = world.get(this.localUser.entityId, AbilityComp);

        if (moveComp) {
            moveComp.actions.justPressed.clear();
            moveComp.yaw = this.localUser.yaw;
            moveComp.pitch = this.localUser.pitch;
            // Sync action states
            moveComp
        }

        if (abilityComp) {
            if (this.localUser.actions.held.has(Actions.ABILITY1)) {
                abilityComp.action = Actions.ABILITY1;
            } else if (this.localUser.actions.held.has(Actions.ABILITY2)) {
                abilityComp.action = Actions.ABILITY2;
            }
        }


    }
}