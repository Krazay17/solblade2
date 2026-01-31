import { Component } from "#/common/core/ECS";
import { EntityTypes } from "#/common/core/SolConstants";

export class MetadataComp extends Component {
    constructor(public type: EntityTypes = EntityTypes.none, public active: boolean = true) { super(); }
}