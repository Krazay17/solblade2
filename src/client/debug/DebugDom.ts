import "./debug.css"

class DebugDom {
    dom: HTMLElement;
    els: Map<string, HTMLElement>;
    constructor() {
        this.dom = document.createElement("div");
        document.body.appendChild(this.dom);
        this.dom.id = "debug";
        this.els = new Map();
    }
    add(name: string, text?: string) {
        const el = document.createElement("div");
        el.classList.add("debug-row");
        el.textContent = text ?? name;
        this.dom.appendChild(el);
        this.els.set(name, el);
        return el;
    }
    get(name: string): HTMLElement | undefined {
        return this.els.get(name);
    }
    set(name: string, text: string) {
        const el = this.get(name);
        if (el) el.textContent = text;
        else this.add(name, text);
    }
}

export const debug = new DebugDom();