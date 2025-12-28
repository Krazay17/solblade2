import RAPIER from "@dimforge/rapier3d";
import { SOL_PHYS } from "../config/SolConstants";

export class Physics {
    public world: RAPIER.World;
    constructor() {
        this.world = new RAPIER.World(SOL_PHYS.GRAVITY);
    }
}