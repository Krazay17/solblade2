import { defineComponent, EntityTypes, type ComponentDef } from "../core/SolConstants"
import { InputComp, MovementComp, TransformComp, ViewComp } from "../systems"

export const EntityConfig: Record<EntityTypes, { components: ComponentDef[] }> = {
    [EntityTypes.player]: {
        components: [
            defineComponent(TransformComp),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(InputComp),
            defineComponent(ViewComp)
        ]
    },
    [EntityTypes.box]: {
        components: [
            defineComponent(TransformComp),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(InputComp),
            defineComponent(ViewComp)
        ]
    }
}

