import { Comps } from "./ECS";
import { AnimationComp } from "#/client/modules/animation/AnimationComp";
import { NameplateComp } from "#/client/modules/nameplate/NameplateComp";
import { ViewComp } from "#/client/modules/view/ViewComp";
import { MovementComp } from "../modules/movement/MovementComp";
import { PhysicsComp } from "../modules/physics/PhysicsComp";
import { AbilityComp } from "../modules/ability/AbilityComp";
import { MetadataComp } from "../modules/meta/MetadataComp";
import { LocalComp, RemoteComp, AuthorityComp } from "../modules/network/NetComps";
import { StatusComp } from "../modules/status/StatusComp";
import { TransformComp } from "../modules/transform/TransformComp";
import { OwnerComp } from "../modules/controller/OwnerComp";
import { UserComp } from "../modules/controller/UserComp";
import { VitalsComp } from "../modules/vitals/VitalsComp";
import { IndicatorComp } from "../../client/modules/indicator/IndicatorComp";

export const CompReg = {
    [Comps.User]: UserComp,
    [Comps.Transform]: TransformComp,
    [Comps.Physics]: PhysicsComp,
    [Comps.Movement]: MovementComp,
    [Comps.Animation]: AnimationComp,
    [Comps.Ability]: AbilityComp,
    [Comps.View]: ViewComp,
    [Comps.Vitals]: VitalsComp,
    [Comps.Nameplate]: NameplateComp,
    [Comps.Meta]: MetadataComp,
    [Comps.Local]: LocalComp,
    [Comps.Remote]: RemoteComp,
    [Comps.Authority]: AuthorityComp,
    [Comps.Owner]: OwnerComp,
    [Comps.Status]: StatusComp,
    [Comps.Indicator]: IndicatorComp,
};

export type CompInstanceMap = {
    [K in keyof typeof CompReg]: InstanceType<typeof CompReg[K]>;
};

export type ComponentDefinition = {
    [K in keyof typeof CompReg]: {
        type: K;
        data?: Partial<CompInstanceMap[K]>;
    };
}[keyof CompInstanceMap];