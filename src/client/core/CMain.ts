import { CGame } from "./CGame";
import { CNet } from "./CNet";

const net = new CNet();
const game = new CGame();
game.run();
net.connect();