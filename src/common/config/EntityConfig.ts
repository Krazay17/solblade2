import { compDef, Comps, type ICompDef } from "../core/ECSRegi";
import { EntityTypes } from "../core/SolConstants"

export const EntityConfig: Record<EntityTypes, { components: ICompDef[] }> = {
    [EntityTypes.none]: {
        components: [],
    },
    [EntityTypes.user]: {
        components: [
            compDef(Comps.User)
        ],
    },
    [EntityTypes.player]: {
        components: [
            compDef(Comps.Transform),
            compDef(Comps.Physics, { type: "pawn", static: false }),
            compDef(Comps.View, { modelName: "Wizard", offsetPos: -1, offsetRot: Math.PI }),
            compDef(Comps.Animation, { nameMap: { fireball: "attack1" } }),
            compDef(Comps.Movement),
            compDef(Comps.Ability),
            compDef(Comps.Vitals),
            compDef(Comps.Nameplate),
        ]
    },
    [EntityTypes.wizard]: {
        components: [
            compDef(Comps.Transform),
            compDef(Comps.Physics, { type: "pawn", static: false }),
            compDef(Comps.View, { modelName: "Wizard", offsetPos: -1, offsetRot: Math.PI }),
            compDef(Comps.Animation, { nameMap: { fireball: "attack1" } }),
            compDef(Comps.Movement),
            compDef(Comps.Ability),
            compDef(Comps.Vitals),
            compDef(Comps.Nameplate),
        ]
    },
    [EntityTypes.fireball]: {
        components: [
            compDef(Comps.Transform),
            compDef(Comps.Physics, { type: "ball", static: false }),
            compDef(Comps.View, { modelName: "ball" }),
        ]
    },
    [EntityTypes.box]: {
        components: [
            compDef(Comps.Transform),
            compDef(Comps.Physics, { static: false }),
            compDef(Comps.View),
        ]
    },
    [EntityTypes.golem]: {
        components: [
            compDef(Comps.Transform),
            compDef(Comps.Physics, { static: false }),
            compDef(Comps.View),
        ]
    }
}

