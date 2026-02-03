import { Component } from "#/common/core/ECS";

export class OwnerComp extends Component {
    ownerId = 0;
    step = 0;
    predicted = false;
    setOwnerId(id){
        this.ownerId = id;
        return this;
    }
    setStep(step){
        this.step = step;
        return this;
    }
}
