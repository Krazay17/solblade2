import type { Actions } from "@/common/core/SolConstants";
import { Component } from "../../common/modules/Component";

export class LocalUser extends Component {
    inputsDown = new Set<string>();
    inputsPressed = new Set<string>();
    pressBuffer = new Set<string>();
    actions = new Map<Actions, boolean>();
    entityId = -1;
    yaw = 0;
    pitch = 0;
    sensitivity = 0.0015;
}