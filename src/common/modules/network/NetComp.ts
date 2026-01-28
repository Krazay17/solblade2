import { Component } from "#/common/core/ECS";
import { EntityTypes, NetworkRole } from "#/common/core/SolConstants";

export class NetComp extends Component{
    role: NetworkRole = NetworkRole.AUTHORITY;
    type: EntityTypes = EntityTypes.box;
    
}