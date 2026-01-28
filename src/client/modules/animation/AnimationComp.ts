import { Component } from "#/common/core/ECS"

export class AnimationComp extends Component {
    current: string = "";
    previous: string = "";
    seek: number = 0;
    blendTime: number = 0.2;
    timescale: number = 1;
    nameMap: Record<string, string> | null = null;
}