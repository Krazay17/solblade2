import { Component } from "@/common/modules/Component";
import { Object3D } from "three";

export class CameraArm extends Component {
    yawObject = new Object3D();
    pitchObject = new Object3D();
    public offset = { x: 0, y: 1.5, z: 0 }; // Height of the "shoulder"
    public targetDistance = 5.0;            // Desired distance from player
    public currentDistance = 5.0;           // Actual distance (changes during collisions)
    public zoomSpeed = 0.5;
}