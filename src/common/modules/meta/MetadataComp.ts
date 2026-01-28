import { Component } from "#/common/core/ECS";
import { EntityTypes } from "#/common/core/SolConstants";

export class MetadataComp extends Component {
    type: EntityTypes = EntityTypes.box;
    active: boolean = true;
}