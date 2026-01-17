import { Object3D, Vector3 } from "three";
import { KeyMap } from "./Controls";
import { Actions } from "@/common/core/SolConstants";
import type { Rendering } from "../core/Rendering";
import type { Actor } from "@/common/core/Actor";
import type { MovementComp } from "@/common/systems/movement/MovementComp";

type ActionCallback = (active: boolean) => void;

export class PlayerController {
    // Stores current state of all actions
    private state: Map<Actions, boolean> = new Map();
    // Stores subscribers for each action
    private listeners: Map<Actions, Set<ActionCallback>> = new Map();
    private pointerLocked = false;
    public sensitivity = 0.0015;

    public playerActor?: Actor;
    public yaw = 0;
    public pitch = 0;
    public yawPivot = new Object3D();
    public pitchPivot = new Object3D();

    private _tempForward = new Vector3();
    private _tempRight = new Vector3();
    private _tempDir = new Vector3();

    constructor(private gameCanvas: HTMLElement, private rendering: Rendering) {
        this.rendering.camera.position.set(0, 0, 3);
        this.rendering.scene.add(this.yawPivot);
        this.yawPivot.add(this.pitchPivot);
        this.pitchPivot.add(this.rendering.camera);

        this.gameCanvas.addEventListener("mousedown", (e) => { this.gameClick(e, true) });
        this.gameCanvas.addEventListener("mouseup", (e) => { this.gameClick(e, false) });
        this.gameCanvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        // window.addEventListener("mousedown", (e) => this.handleClick(e, true));
        // window.addEventListener("mouseup", (e) => this.handleClick(e, false));
        // window.addEventListener("mousemove", (e) => this.handleMouseMove(e));
        window.addEventListener("keydown", (e) => this.handleKey(e, true));
        window.addEventListener("keyup", (e) => this.handleKey(e, false));

        document.onpointerlockchange = () => {
            if (document.pointerLockElement === this.gameCanvas) this.pointerLocked = true;
            else this.pointerLocked = false;
        }
    }

    tick(dt: number, time: number) {
        if (!this.playerActor) return;
        const playerPos = this.playerActor.body!.translation();
        playerPos.y += 1;
        this.yawPivot.position.lerp(playerPos, 20 * dt);
    }

    updatePlayerMovement(comp: MovementComp) {
        // 1. Simple axis calculation
        const moveZ = (this.state.get(Actions.FWD) ? 1 : 0) - (this.state.get(Actions.BWD) ? 1 : 0);
        const moveX = (this.state.get(Actions.RIGHT) ? 1 : 0) - (this.state.get(Actions.LEFT) ? 1 : 0);

        // 2. Get camera basis
        this._tempForward.set(0, 0, -1).applyQuaternion(this.yawPivot.quaternion);
        this._tempRight.set(1, 0, 0).applyQuaternion(this.yawPivot.quaternion);

        // 3. Calculate Intent
        this._tempDir.set(0, 0, 0)
            .addScaledVector(this._tempForward, moveZ)
            .addScaledVector(this._tempRight, moveX);

        // 4. Normalize if moving, otherwise zero it out
        if (this._tempDir.lengthSq() > 0) {
            this._tempDir.normalize();
        }

        // 5. Write to Component
        comp.inputs.moveDir.x = this._tempDir.x;
        comp.inputs.moveDir.z = this._tempDir.z;
    }

    setPlayerActor(actor: Actor) {
        this.playerActor = actor;
    }

    private gameClick(event: MouseEvent, isDown: boolean) {
        if (document.pointerLockElement !== this.gameCanvas) {
            this.gameCanvas.requestPointerLock();
            return;
        }

    }

    private handleMouseMove(event: MouseEvent) {
        if (!this.pointerLocked) return;
        if (Math.abs(event.movementX) > 500 || Math.abs(event.movementY) > 500) return;
        const TWO_PI = Math.PI * 2;
        const HALF_PI = Math.PI / 2 - 0.01;
        this.yaw -= event.movementX * this.sensitivity;
        this.pitch -= event.movementY * this.sensitivity;

        this.yaw = ((this.yaw % TWO_PI) + TWO_PI) % TWO_PI;
        this.pitch = Math.max(-HALF_PI, Math.min(HALF_PI, this.pitch));


        if (this.playerActor) this.playerActor.applyYaw(this.yaw);
        this.yawPivot.rotation.y = this.yaw;
        this.pitchPivot.rotation.x = this.pitch;
        this.yawPivot.updateMatrixWorld(true);
    }

    private handleClick(event: MouseEvent, isDown: boolean) {
        console.log(event.currentTarget);
    }

    private handleKey(event: KeyboardEvent, isDown: boolean) {
        const action = KeyMap[event.code];
        if (action === undefined || this.state.get(action) === isDown) return;

        this.state.set(action, isDown);
        this.emit(action, isDown);
    }

    // Subscribe to specific action changes
    public on(action: Actions, callback: ActionCallback) {
        if (!this.listeners.has(action)) this.listeners.set(action, new Set());
        this.listeners.get(action)!.add(callback);
    }

    private emit(action: Actions, active: boolean) {
        this.listeners.get(action)?.forEach(cb => cb(active));
    }

    // Direct polling for the game loop/server sync
    public getActionState(action: Actions): boolean {
        return !!this.state.get(action);
    }
}