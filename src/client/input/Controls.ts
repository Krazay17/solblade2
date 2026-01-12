export enum Actions {
    Jump = 1 << 0,
    Fwd = 1 << 1,
    Bwd = 1 << 2,
    Left = 1 << 3,
    Right = 1 << 4,
}

export let KeyMap: Record<string, Actions> = {
    Space: Actions.Jump,
    KeyW: Actions.Fwd,
    KeyS: Actions.Bwd,
    KeyA: Actions.Left,
    KeyD: Actions.Right
}

export function SetKey(action: Actions, key: string) {
    KeyMap[key] = action;
}