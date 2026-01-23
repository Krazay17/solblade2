import type { Actions } from "#/common/core/SolConstants";

export class LocalUser {
actions = {
    pressed: new Set<Actions>(),
    held: new Set<Actions>()
}
    entityId = -1;
    yaw = 0;
    pitch = 0;
    sensitivity = 0.0015;
}