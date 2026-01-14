import { Object3D, Vector3 } from "three";
import { Actions, KeyMap } from "./Controls";
import type { Rendering } from "../core/Rendering";
import type { Actor } from "@/common/actor/Actor";

type ActionCallback = (active: boolean) => void;

export class PlayerController {
    // Stores current state of all actions
    private state: Map<Actions, boolean> = new Map();
    // Stores subscribers for each action
    private listeners: Map<Actions, Set<ActionCallback>> = new Map();
    private pointerLocked = false;
    public sensitivity = 0.001;

    public playerActor?: Actor;
    public yaw = 0;
    public pitch = 0;
    public cameraArm = new Object3D();

    constructor(private gameCanvas: HTMLElement, private rendering: Rendering) {
        this.cameraArm.position.set(1, 0, 0);
        this.rendering.camera.position.set(0, 0, 5);
        this.rendering.scene.add(this.cameraArm);
        this.cameraArm.add(this.rendering.camera);

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

    tick(dt:number, time:number){
        if(!this.playerActor)return;
        this.cameraArm.position.set(this.playerActor.pos[0], this.playerActor.pos[1], this.playerActor.pos[2]);
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
        if(!this.pointerLocked)return;
        const TWO_PI = Math.PI * 2;
        const HALF_PI = Math.PI / 2 - 0.01;
        this.yaw -= event.movementX * this.sensitivity;
        this.pitch -= event.movementY * this.sensitivity;

        this.yaw = ((this.yaw % TWO_PI) + TWO_PI) % TWO_PI;
        this.pitch = Math.max(-HALF_PI, Math.min(HALF_PI, this.pitch));


        if (this.playerActor) this.playerActor.applyYaw(this.yaw);
        this.cameraArm.rotation.x = this.pitch;
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