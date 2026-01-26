import type { LocalUser } from "../modules/user/LocalUser";
import { KeyMap } from "./Controls";


export class LocalInput {
    pointerLocked = false;
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
            this.localUser.actions.held |= action;
        } else this.localUser.actions.held &= ~action;
    }

    handleKey(e: KeyboardEvent, b: boolean) {
        if (b && e.repeat) return;
        const action = KeyMap[e.code];
        if (b) {
            this.localUser.actions.held |= action;
        } else this.localUser.actions.held &= ~action;
    }
}