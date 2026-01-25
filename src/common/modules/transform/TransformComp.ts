import { Component } from "#/common/core/ECS";
import { SolQuat, SolVec3 } from "#/common/core/SolMath";

export class TransformComp extends Component{
    pos = new SolVec3();
    lastPos = new SolVec3();
    quat = new SolQuat();
    lastQuat = new SolQuat();
}