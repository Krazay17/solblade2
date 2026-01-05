import RAPIER from "@dimforge/rapier3d";
import { SGame } from "./SGame";

async function start() {
    await RAPIER.init();

    const game = new SGame();
    game.run();

}
start();