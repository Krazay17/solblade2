import { defineComponent, EntityTypes, type ComponentDef } from "../core/SolConstants"
import { MovementComp, TestComp, ViewComp } from "../systems"
import { PhysicsComp } from "../systems/physics/PhysicsComp"

export const EntityConfig: Record<EntityTypes, { components: ComponentDef[] }> = {
    [EntityTypes.player]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(ViewComp)
        ]
    },
    [EntityTypes.box]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(ViewComp)
        ]
    },
    [EntityTypes.box2]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(TestComp),
            defineComponent(ViewComp)
        ]
    }
}

