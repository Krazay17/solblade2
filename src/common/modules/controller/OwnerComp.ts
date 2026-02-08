import { Component } from "#/common/core/ECS";

export class OwnerComp extends Component {
    ownerId: number = 0;
    iid = 0;
    predicted = false;
    setUserId(id: number) {
        this.ownerId = id;
        return this;
    }
    setInputId(id: number) {
        this.iid = id;
        return this;
    }
}
