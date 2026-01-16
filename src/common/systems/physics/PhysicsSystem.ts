import type { World } from "@/common/core/World";
import type { ISystem } from "../System";
import type { Component } from "../Component";
import { PhysicsComp } from "./PhysicsComp";
import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYS } from "@/common/core/SolConstants";
import { createBody } from "@/common/core/PhysicsFactory";
import { ControllerType } from "@/common/core/Actor";

export class PhysicsSystem implements ISystem {
    private components: PhysicsComp[] = [];
    private physWorld = new RAPIER.World(SOL_PHYS.GRAVITY);
    constructor() {
        this.physWorld.timestep = SOL_PHYS.TIMESTEP;
    }
    addComp(comp: Component): void {
        if (comp instanceof PhysicsComp) {
            this.components.push(comp);
            const { body } = createBody(this.physWorld, comp, ControllerType.LOCAL_PLAYER);
            comp.body = body;
            body.userData = { entityId: comp.entityId };
        }
    }
    update(world: World, dt: number): void {
        this.physWorld.step();
    }
    // removeEntity(entityId: number) {
    //     const comp = this.physWorld.getComponent(entityId, PhysicsComp);
    //     if (comp && comp.body) {
    //         this.physWorld.removeRigidBody(comp.body);
    //     }
    // }
}