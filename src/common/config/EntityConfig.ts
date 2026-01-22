import { AnimationComp } from "@/client/modules/animation/AnimationComp";
import { defineComponent, EntityTypes, type ComponentDef } from "../core/SolConstants"
import { MovementComp, TestComp, ViewComp, PhysicsComp } from "../modules";
import { AbilityComp } from "../modules/ability/AbilityComp";

export const EntityConfig: Record<EntityTypes, { components: ComponentDef[] }> = {
    [EntityTypes.player]: {
        components: [
            defineComponent(PhysicsComp),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(ViewComp, { modelName: "spikeMan", offsetPos: -1, offsetRot: Math.PI }),
        ]
    },
    [EntityTypes.wizard]: {
        components: [
            defineComponent(PhysicsComp, { type: "pawn" }),
            defineComponent(MovementComp),
            defineComponent(ViewComp, { modelName: "Wizard", offsetPos: -1, offsetRot: Math.PI }),
            defineComponent(AnimationComp, {currentAnim: "attack1", nameMap: {fireball: "attack1"}}),
            defineComponent(AbilityComp),
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

