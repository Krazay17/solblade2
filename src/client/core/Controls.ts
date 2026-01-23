import { Actions } from "#/common/core/SolConstants";

export let KeyMap: Record<string, Actions> = {
    Space: Actions.JUMP,
    KeyW: Actions.FWD,
    KeyS: Actions.BWD,
    KeyA: Actions.LEFT,
    KeyD: Actions.RIGHT,
    0: Actions.ABILITY1,
    2: Actions.ABILITY2,
    KeyE: Actions.NEXTE,
    KeyQ: Actions.LASTE,
}

export function SetKey(action: Actions, key: string) {
    KeyMap[key] = action;
}