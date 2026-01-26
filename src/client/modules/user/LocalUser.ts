import type { Actions } from "#/common/core/SolConstants";

export class LocalUser {
    actions = {
        pressed: new Set<Actions>(),
        held: 0
    }
    netId = 0;
    entityId = 0;
    yaw = 0;
    pitch = 0;
    sensitivity = 0.0015;
}