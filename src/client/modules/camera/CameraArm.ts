import RAPIER from "@dimforge/rapier3d-compat";
import { Object3D } from "three";

export class CameraArm {
    yawObject = new Object3D();
    pitchObject = new Object3D();
    public offset = { x: 0, y: 1.5, z: 0 }; // Height of the "shoulder"
    public targetDistance = 5.0;            // Desired distance from player
    public currentDistance = 5.0;           // Actual distance (changes during collisions)
    public zoomSpeed = 0.5;
    public probe = new RAPIER.Ball(1);
    constructor(){
        this.yawObject.add(this.pitchObject);
    }
}