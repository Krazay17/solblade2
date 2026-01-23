import { Component } from "#/common/core/ECS"

export class AnimationComp extends Component {
    currentAnim: string = "idle";
    animSeek: number = 0;
    prevAnim: string = this.currentAnim;
    blendTime: number = 0.2;
    timescale: number = 1;
    nameMap: Record<string, string> = {};
}