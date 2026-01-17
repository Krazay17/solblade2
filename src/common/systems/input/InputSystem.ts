import type { World } from "@/common/core/World";
import type { ISystem } from "../System";
import type { Component } from "../Component";
import type { HardwareInput } from "./HardwareInput";


export class InputSystem implements ISystem {
    pointerLocked = false;
    constructor(private hardwareInput: HardwareInput, private gameCanvas: HTMLElement) {
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
        this.hardwareInput.yaw -= event.movementX * this.hardwareInput.sensitivity;
        this.hardwareInput.pitch -= event.movementY * this.hardwareInput.sensitivity;

        this.hardwareInput.yaw = ((this.hardwareInput.yaw % TWO_PI) + TWO_PI) % TWO_PI;
        this.hardwareInput.pitch = Math.max(-HALF_PI, Math.min(HALF_PI, this.hardwareInput.pitch));
    }
    gameClick(e: MouseEvent, b: boolean) {
        if (b) {
            this.hardwareInput.inputsPressed.add(String(e.button));
            this.hardwareInput.inputsDown.add(String(e.button));
        }
        else this.hardwareInput.inputsDown.delete(String(e.button));

    }
    handleKey(e: KeyboardEvent, b: boolean) {
        if (b) {
            this.hardwareInput.inputsPressed.add(e.code);
            this.hardwareInput.inputsDown.add(e.code);
        }
        else this.hardwareInput.inputsDown.delete(e.code);

    }
    addComp(comp: Component): void {

    }
    update(world: World, dt: number): void {

    }
    clearPressed() {
        this.hardwareInput.inputsPressed.clear();

    }
    preTick(world: World, dt: number): void {
    }
}