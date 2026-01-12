import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYS } from "../config/SolConstants";

await RAPIER.init();

export class Physics {
    public world: RAPIER.World;
    constructor() {
        this.world = new RAPIER.World(SOL_PHYS.GRAVITY);
    }
}