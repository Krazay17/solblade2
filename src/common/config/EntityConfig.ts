import { type ComponentDefinition } from "../core/ECSRegi";
import { EntityTypes } from "../core/SolConstants"
import { Comps } from "../core/ECS";

export const EntityConfig: Record<EntityTypes, { components: ComponentDefinition[] }> = {
    [EntityTypes.none]: {
        components: []
    },
    [EntityTypes.user]: {
        components: [
            { type: Comps.User }
        ]
    },
    [EntityTypes.player]: {
        components: [
            { type: Comps.Transform },
            { type: Comps.Physics, data: { type: "pawn", static: false } },
            { type: Comps.View, data: { modelName: "spikeMan", offsetPos: -1 } },
            { type: Comps.Animation },
            { type: Comps.Movement },
            { type: Comps.Ability },
            { type: Comps.Vitals },
            { type: Comps.Nameplate }
        ]
    },
    [EntityTypes.wizard]: {
        components: [
            { type: Comps.Transform },
            { type: Comps.Physics, data: { type: "pawn", static: false } },
            { type: Comps.View, data: { modelName: "Wizard", offsetPos: -1, offsetRot: Math.PI } },
            { type: Comps.Animation, data: { nameMap: { fireball: "attack1" } } },
            { type: Comps.Movement },
            { type: Comps.Ability },
            { type: Comps.Vitals },
            { type: Comps.Nameplate }
        ]
    },
    [EntityTypes.fireball]: {
        components: [
            { type: Comps.Transform },
            { type: Comps.Physics, data: { type: "ball", static: false } },
            { type: Comps.View, data: { modelName: "ball" } },
            { type: Comps.Nameplate }
        ]
    },
    [EntityTypes.box]: {
        components: [
            { type: Comps.Transform },
            { type: Comps.Physics, data: { type: "cube", static: false } },
            { type: Comps.View, data: { modelName: "ball" } },
        ]
    }
}

