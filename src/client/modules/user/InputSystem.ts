import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/core/ECS"
import type { LocalUser } from "./LocalUser";
import { MovementComp } from "@/common/modules";
import { KeyMap } from "../../core/Controls";
import { Actions } from "@/common/core/SolConstants";
import { SolVec3 } from "@/common/core/SolMath";


export class InputSystem implements ISystem {
    pointerLocked = false;
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
        if (b) {
            this.localUser.inputsPressed.add(String(e.button));
            this.localUser.inputsDown.add(String(e.button));
        }
        else this.localUser.inputsDown.delete(String(e.button));

    }

    handleKey(e: KeyboardEvent, b: boolean) {
        if (b && e.repeat) return;
        if (b) {
            this.localUser.pressBuffer.add(e.code);
            this.localUser.inputsDown.add(e.code);
            this.localUser.actions.set(KeyMap[e.code], true);
        }
        else {
            this.localUser.inputsDown.delete(e.code);
            this.localUser.actions.set(KeyMap[e.code], false);
        }

    }

    preUpdate(world: World, dt: number, time: number): void {
        // 1. Wipe the state from the PREVIOUS frame
        this.localUser.inputsPressed.clear();

        // 2. If we have buffered presses, move them to the active state
        if (this.localUser.pressBuffer.size > 0) {
            for (const key of this.localUser.pressBuffer) {
                this.localUser.inputsPressed.add(key);
            }
            // 3. Clear buffer so we don't double-trigger next frame
            this.localUser.pressBuffer.clear();
        }
        // Sync local intent to the physical component
        if (this.localUser.entityId !== -1) {
            const moveComp = world.get(this.localUser.entityId, MovementComp);
            if (moveComp) {
                // We copy values so the Simulation has its own copy of the state
                moveComp.yaw = this.localUser.yaw;
                moveComp.pitch = this.localUser.pitch;
                // Sync action states
                for (const [action, active] of this.localUser.actions) {
                    moveComp.actionMap.set(action, active);
                }
            }
        }

    }

    updatePlayerMovement(move: MovementComp) {
        // 1. Simple axis calculation
        const moveZ = (this.localUser.actions.get(Actions.FWD) ? 1 : 0) - (this.localUser.actions.get(Actions.BWD) ? 1 : 0);
        const moveX = (this.localUser.actions.get(Actions.RIGHT) ? 1 : 0) - (this.localUser.actions.get(Actions.LEFT) ? 1 : 0);

        // 2. Get camera basis
        this._tempForward.set(0, 0, -1)
        this._tempRight.set(1, 0, 0)

        this._tempForward.multiplyScalar(moveZ);
        this._tempRight.multiplyScalar(moveX);
        // 3. Calculate Intent
        this._tempDir.set(0, 0, 0).add(this._tempForward).add(this._tempRight);

        // 4. Normalize if moving, otherwise zero it out
        if (this._tempDir.length() > 0) {
            this._tempDir.normalize();
        }
    }
}