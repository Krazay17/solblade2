import { SolQuat, SolVec3 } from "@/common/core/SolMath";
import { Component } from "../Component";

export class TransformComp extends Component{
    lastPos = new SolVec3();
    pos = new SolVec3();
    lastRot = new SolQuat();
    rot = new SolQuat();
}