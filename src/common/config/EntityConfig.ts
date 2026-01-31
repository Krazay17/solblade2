import { AnimationComp } from "#/client/modules/animation/AnimationComp";
import { defineComponent, EntityTypes, type ComponentDef } from "../core/SolConstants"
import { MovementComp, PhysicsComp } from "../modules";
import { ViewComp } from "#/client/modules/view/ViewComp";
import { AbilityComp } from "../modules/ability/AbilityComp";
import { TransformComp } from "../modules/transform/TransformComp";
import { VitalsComp } from "../modules/vitals/VitalsComp";
import { UserComp } from "../modules/user/UserComp";

export const EntityConfig: Record<EntityTypes, { components: ComponentDef[] }> = {
    [EntityTypes.none]: {
        components: [],
    },
    [EntityTypes.user]: {
        components: [
            defineComponent(UserComp)
        ],
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
            defineComponent(AnimationComp, { nameMap: { fireball: "attack1" } }),
            defineComponent(AbilityComp),
            defineComponent(VitalsComp)
        ]
    },
    [EntityTypes.fireball]: {
        components: [
            defineComponent(TransformComp),
            defineComponent(PhysicsComp, { type: "ball", static: false }),
            defineComponent(ViewComp, { modelName: "ball" }),
        ]
    },
    [EntityTypes.box]: {
        components: [
            defineComponent(TransformComp),
            defineComponent(PhysicsComp),
            defineComponent(MovementComp, { speed: 55 }),
            defineComponent(ViewComp)
        ]
    },
    [EntityTypes.golem]: {
        components: [
            defineComponent(TransformComp),
            defineComponent(PhysicsComp),
            defineComponent(MovementComp),
            defineComponent(ViewComp, { modelName: "LavaGolem" }),

        ]
    }
}

