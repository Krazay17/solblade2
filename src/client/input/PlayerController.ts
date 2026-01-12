import { Actions, KeyMap } from "./Controls";

type ActionCallback = (active: boolean) => void;

export class PlayerController {
    // Stores current state of all actions
    private state: Map<Actions, boolean> = new Map();
    // Stores subscribers for each action
    private listeners: Map<Actions, Set<ActionCallback>> = new Map();

    constructor() {
        window.addEventListener("keydown", (e) => this.handleKey(e, true));
        window.addEventListener("keyup", (e) => this.handleKey(e, false));
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