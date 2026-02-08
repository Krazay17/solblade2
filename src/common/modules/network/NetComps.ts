import { Component } from "#/common/core/ECS";

export class LocalComp extends Component {
    static domain = 0;
}

export class RemoteComp extends Component {
    static domain = 0;
    lastSeen: number = 0;
}

export class AuthorityComp extends Component {
}