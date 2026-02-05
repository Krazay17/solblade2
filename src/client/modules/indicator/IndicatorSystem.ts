import { Comps, type ISystem } from "#/common/core/ECS";
import type { SolWorld } from "#/common/core/SolWorld";

export class IndicatorSystem implements ISystem {
    postStep(world: SolWorld, dt: number, time: number): void {
        world.query([Comps.Indicator]).forEach(id => this.process(world, id, dt, time));
    }
    process(world: SolWorld, id: number, dt: number, time: number): void {
        const indicator = world.get(id, Comps.Indicator)!;
        
    }
}