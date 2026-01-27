import { KeyMap } from "./Controls";


export class LocalInput {
    public heldMask = 0;
    public yaw = 0;
    public pitch = 0;
    public sensitivity = 0.0015;
    public pointerLocked = false;

    constructor(private gameCanvas: HTMLElement) {
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

    handleMouseMove(e: MouseEvent) {
        if (!this.pointerLocked) return;
        if (Math.abs(e.movementX) > 500 || Math.abs(e.movementY) > 500) return;
        const TWO_PI = Math.PI * 2;
        const HALF_PI = Math.PI / 2 - 0.01;
        this.yaw -= e.movementX * this.sensitivity;
        this.pitch -= e.movementY * this.sensitivity;
        this.yaw = ((this.yaw % TWO_PI) + TWO_PI) % TWO_PI;
        this.pitch = Math.max(-HALF_PI, Math.min(HALF_PI, this.pitch));
    }

    gameClick(e: MouseEvent, b: boolean) {
        if (!this.pointerLocked) {
            this.gameCanvas.requestPointerLock();
            return;
        }
        const action = KeyMap[String(e.button)];
        if (b) {
            this.heldMask |= action;
        } else this.heldMask &= ~action;
    }

    handleKey(e: KeyboardEvent, b: boolean) {
        if (b && e.repeat) return;
        const action = KeyMap[e.code];
        if (b) {
            this.heldMask |= action;
        } else this.heldMask &= ~action;
    }
}