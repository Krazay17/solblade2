import type { World } from "@/common/core/World";
import type { Component } from "../Component";
import type { ISystem } from "../System";
import { TestComp } from "./TestComp";
import { PhysicsComp } from "../physics/PhysicsComp";
import { SolVec3 } from "@/common/core/SolMath";

export class TestSystem implements ISystem {
    tempVec = new SolVec3(5,0,0);
    addComp(comp: Component): void {
        
    }
    update(world: World, dt: number): void {
        const ids = world.query(TestComp);
        for(const id of ids){
            world.getComponent(id, PhysicsComp)?.body?.setLinvel(this.tempVec, true);
        }
    }
}