import { Actions } from "@/common/core/SolConstants";

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