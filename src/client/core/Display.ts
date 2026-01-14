export class Display {
    currentTick: number = 0;
    tickRate = 60;
    runtime: number = 0;

    background = "#00000000";
    foreground = "#50ff50";
    pointerSize = 10;
    aspectRatio: number = 1;
    constructor(private canvas: HTMLCanvasElement, private ctx: CanvasRenderingContext2D) {
        this.size();
        window.addEventListener("resize", () => {
            this.size();
            this.drawCursor();
        });
    }
    size() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.aspectRatio = w / h;
        this.canvas.width = w;
        this.canvas.height = h;
    }
    run() {
        this.loop(0);
    }
    loop = (time: number) => {
        const dt = performance.now() - time;
        //console.log(dt);
        this.drawCursor();
        setTimeout(this.loop, 1000 / this.tickRate, performance.now());
    }
    drawCursor() {
        this.clear();
        this.point(this.canvas.width / 2, this.canvas.height / 2);
    }
    clear() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.fillStyle = this.background;
        this.ctx.fillRect(0, 0, w, h);
    }
    point(x: number, y: number) {
        const size = this.pointerSize * this.aspectRatio;
        this.ctx.fillStyle = this.foreground;
        this.ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
}