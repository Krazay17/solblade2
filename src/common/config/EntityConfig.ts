import { AnimationComp } from "#/client/modules/animation/AnimationComp";
import { defineComponent, EntityTypes, type ComponentDef } from "../core/SolConstants"
import { MovementComp, PhysicsComp } from "../modules";
import { ViewComp } from "#/client/modules/view/ViewComp";
import { AbilityComp } from "../modules/ability/AbilityComp";
import { TransformComp } from "../modules/transform/TransformComp";
import { VitalsComp } from "../modules/vitals/VitalsComp";

export const EntityConfig: Record<EntityTypes, { components: ComponentDef[] }> = {
    [EntityTypes.none]: {
        components: [],
    },
    [EntityTypes.user]: {
        components: [],
    },
    [EntityTypes.player]: {
        components: [
            defineComponent(TransformComp),
            defineComponent(PhysicsComp, { type: "pawn", static: false }),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(ViewComp, { modelName: "spikeMan", offsetPos: -1, offsetRot: 0 }),
            defineComponent(AnimationComp),
            defineComponent(AbilityComp),
            defineComponent(ViewComp),
        ]
    },
    [EntityTypes.wizard]: {
        components: [
            defineComponent(TransformComp),
            defineComponent(PhysicsComp, { type: "pawn", static: false }),
            defineComponent(MovementComp),
            defineComponent(ViewComp, { modelName: "Wizard", offsetPos: -1, offsetRot: Math.PI }),
            defineComponent(AnimationComp, { current: "attack1", nameMap: { fireball: "attack1" } }),
            defineComponent(AbilityComp),
            defineComponent(VitalsComp)
        ]
    },
    [EntityTypes.box]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(MovementComp, { speed: 55 }),
            defineComponent(ViewComp)
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

