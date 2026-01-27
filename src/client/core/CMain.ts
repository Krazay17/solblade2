import { CGame } from "./CGame";
import { CNet } from "./CNet";
import { Display } from "./Display";
import { LocalInput } from "./LocalInput";
import { Rendering } from "./Rendering";

//@ts-ignore
let canvas = game;
if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "game";
    canvas.style.pointerEvents = "all";
    canvas.style.zIndex = "1";
    document.appendChild(canvas);
}
export const solInput = new LocalInput(canvas);
export const solRender = new Rendering(canvas);
export const solNet = new CNet();
const cGame = new CGame(solInput, solRender, solNet);
cGame.run();
solNet.connect();

const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;
const ctx = uiCanvas?.getContext("2d");
const display: Display | null = (uiCanvas && ctx) ? new Display(uiCanvas, ctx) : null;
if (display) {
    display.run();
}
