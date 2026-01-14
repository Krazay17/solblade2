import { CGame } from "./CGame";
import { CNet } from "./CNet";
import { Display } from "./Display";

const net = new CNet();
const gameCanvas = document.getElementById("game");
const cGame = gameCanvas ? new CGame(gameCanvas, net) : null;
if (cGame) {
    cGame.run();
    net.connect();
} else {
    console.error("No canvas of id 'game' found!");
}

const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;
const ctx = uiCanvas?.getContext("2d");
const display: Display | null = (uiCanvas && ctx) ? new Display(uiCanvas, ctx) : null;
if (display) {
    display.run();
}
