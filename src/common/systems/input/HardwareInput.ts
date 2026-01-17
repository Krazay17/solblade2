import { Component } from "../Component";

export class HardwareInput extends Component {
    inputsDown = new Set<string>();
    inputsPressed = new Set<string>();
    yaw = 0;
    pitch = 0;
    sensitivity = 0;
}