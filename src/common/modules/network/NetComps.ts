import { Component } from "#/common/core/ECS";

export class AuthorityComp extends Component {}

export class RemoteComp extends Component {
    lastSeen: number = 0;
}

export class LocalComp extends Component {
    stepCount: number = 0;
}