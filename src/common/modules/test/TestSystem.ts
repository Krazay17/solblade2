import type { World } from "#/common/core/World";
import type { ISystem } from "#/common/core/ECS"
import { TestComp } from "./TestComp";
import { PhysicsComp } from "../physics/PhysicsComp";
import { SolVec3 } from "#/common/core/SolMath";

export class TestSystem implements ISystem {
    tempVec = new SolVec3(5,0,0);
    accumulator = 0;
    step(world: World, dt: number, time: number): void {
        const ids = world.query(TestComp);
        this.tempVec.x = Math.cos(time/1000);
        for(const id of ids){
            world.get(id, PhysicsComp)?.body?.setLinvel(this.tempVec, true);
        }
    }
}