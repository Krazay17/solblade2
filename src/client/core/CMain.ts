import { CGame } from "./CGame";
import { CNet } from "./CNet";
import { Display } from "./Display";

const gameCanvas = document.getElementById("game");
const cGame = gameCanvas ? new CGame(gameCanvas) : null;
if (cGame) {
    cGame.run();
} else {
    console.error("No canvas of id 'game' found!");
}

const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;
const ctx = uiCanvas.getContext("2d");
const display: Display | null = (uiCanvas && ctx) ? new Display(uiCanvas, ctx) : null;
if (display) {
    display.run();
}

const net = new CNet();
net.connect();