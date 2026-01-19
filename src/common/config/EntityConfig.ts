import { AnimationComp } from "@/client/modules/AnimationComp";
import { defineComponent, EntityTypes, type ComponentDef } from "../core/SolConstants"
import { MovementComp, TestComp, ViewComp, PhysicsComp } from "../modules";

export const EntityConfig: Record<EntityTypes, { components: ComponentDef[] }> = {
    [EntityTypes.player]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(ViewComp, { modelName: "spikeMan" }),
        ]
    },
    [EntityTypes.box]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(MovementComp, { speed: 55 }),
            defineComponent(ViewComp)
        ]
    },
    [EntityTypes.box2]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(TestComp),
            defineComponent(ViewComp)
        ]
    },
    [EntityTypes.wizard]: {
        components: [
            defineComponent(PhysicsComp, { type: "pawn" }),
            defineComponent(MovementComp),
            defineComponent(ViewComp, { modelName: "Wizard", offsetPos: -1 }),
            defineComponent(AnimationComp),

        ]
    },
    [EntityTypes.golem]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(MovementComp),
            defineComponent(ViewComp, { modelName: "LavaGolem" }),

        ]
    }
}

