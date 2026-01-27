import { AnimationComp } from "#/client/modules/animation/AnimationComp";
import { NetsyncComp } from "#/common/modules/netsync/NetsyncComp";
import { ControllerType, defineComponent, EntityTypes, type ComponentDef } from "../core/SolConstants"
import { MovementComp, TestComp, PhysicsComp } from "../modules";
import { ViewComp } from "#/client/modules/view/ViewComp";
import { AbilityComp } from "../modules/ability/AbilityComp";
import { TransformComp } from "../modules/transform/TransformComp";
import { VitalsComp } from "../modules/vitals/VitalsComp";

export const EntityConfig: Record<EntityTypes, { components: ComponentDef[] }> = {
    [EntityTypes.player]: {
        components: [
            defineComponent(NetsyncComp, { type: EntityTypes.player, controllerType: ControllerType.LOCAL_PLAYER }),
            defineComponent(TransformComp),
            defineComponent(PhysicsComp, { type: "pawn" }),
            defineComponent(MovementComp, { speed: 5 }),
            defineComponent(ViewComp, { modelName: "spikeMan", offsetPos: -1, offsetRot: 0 }),
            defineComponent(AnimationComp),
            defineComponent(AbilityComp),
            defineComponent(ViewComp),
        ]
    },
    [EntityTypes.wizard]: {
        components: [
            defineComponent(NetsyncComp, { type: EntityTypes.wizard, controllerType: ControllerType.AI }),
            defineComponent(TransformComp),
            defineComponent(PhysicsComp, { type: "pawn" }),
            defineComponent(MovementComp),
            defineComponent(ViewComp, { modelName: "Wizard", offsetPos: -1, offsetRot: Math.PI }),
            defineComponent(AnimationComp, { currentAnim: "attack1", nameMap: { fireball: "attack1" } }),
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

