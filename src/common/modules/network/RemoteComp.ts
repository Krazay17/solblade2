import { Component } from "#/common/core/ECS";

export class RemoteComp extends Component {
    lastSeenServerTime: number = 0;
}