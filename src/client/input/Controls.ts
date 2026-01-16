import { Actions } from "@/common/core/SolConstants";

export let KeyMap: Record<string, Actions> = {
    Space: Actions.JUMP,
    KeyW: Actions.FWD,
    KeyS: Actions.BWD,
    KeyA: Actions.LEFT,
    KeyD: Actions.RIGHT
}

export function SetKey(action: Actions, key: string) {
    KeyMap[key] = action;
}