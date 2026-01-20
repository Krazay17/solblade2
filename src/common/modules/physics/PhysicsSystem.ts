import type { World } from "@/common/core/World";
import type { ISystem } from "@/common/core/ECS"
import { PhysicsComp } from "./PhysicsComp";
import RAPIER from "@dimforge/rapier3d-compat";
import { createBody } from "@/common/core/PhysicsFactory";
import { ControllerType, SOL_PHYS } from "@/common/core/SolConstants";

export class PhysicsSystem implements ISystem {
    _activeComponents: PhysicsComp[] = [];
    constructor(private physWorld: RAPIER.World) { }
    step(world: World, dt: number): void {
        const ids = world.query(PhysicsComp);
        this._activeComponents.length = 0; // Clear without reallocating

        // Pass 1: Initialization and "Last State" Capture
        for (const id of ids) {
            const c = world.get(id, PhysicsComp)!;

            if (!c.body) {
                if (c.makingBody) continue;
                c.makingBody = true;
                const { body } = createBody(this.physWorld, c, ControllerType.LOCAL_PLAYER);
                if (body) {
                    c.body = body;
                    body.userData = { entityId: id };
                }
                continue;
            }
            // const vel = c.body.linvel();
            // if(Math.abs(vel.y) > 50) c.body.setLinvel({x: vel.x, y: vel.y * (vel.y / 50), z: vel.z }, false);

            // Capture last state
            c.lastPos.copy(c.pos);
            c.lastRot.copy(c.rot);

            // Cache this component for the post-step update
            this._activeComponents.push(c);
        }

        // Pass 2: The actual Physics Step (WASM)
        this.physWorld.step();

        // Pass 3: Sync back from WASM using direct references
        // No world.get() lookups here!
        for (let i = 0; i < this._activeComponents.length; i++) {
            const c = this._activeComponents[i];
            const rb = c.body!;

            c.pos.copy(rb.translation());
            c.rot.copy(rb.rotation());

            const vel = rb.linvel();
            const sqMag = vel.x * vel.x + vel.y * vel.y + vel.z * vel.z;

            if(sqMag > SOL_PHYS.TERMINAL_VELOCITY_SQ){
                const scale = SOL_PHYS.TERMINAL_VELOCITY / Math.sqrt(sqMag);

                vel.x *= scale;
                vel.y *= scale;
                vel.z *= scale;

                rb.setLinvel(vel, true);
            }
        }
    }
    removeEntity(world: World, entityId: number) {
        const comp = world.get(entityId, PhysicsComp);
        if (comp && comp.body) {
            this.physWorld.removeRigidBody(comp.body);
        }
    }
}