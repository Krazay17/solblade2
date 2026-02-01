import { CGame } from "./CGame";
import { CNet } from "./CNet";
import { UI } from "./UI";
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
const solNet = new CNet();
const solInput = new LocalInput(canvas);
const solRender = new Rendering(canvas);
const cGame = new CGame(solInput, solRender, solNet);
cGame.run();

const uiCanvas = document.getElementById("ui") as HTMLCanvasElement;
const ctx = uiCanvas?.getContext("2d");
const ui: UI | null = (uiCanvas && ctx) ? new UI(uiCanvas, ctx) : null;
if (ui) {
    ui.run();
}
