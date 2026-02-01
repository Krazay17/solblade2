import { Component } from "#/common/core/ECS";
import { SolVec3 } from "#/common/core/SolMath";
import * as THREE from "three"

export class NameplateComp extends Component {
    static domain = 0;
    canvas = document.createElement("canvas");
    context = this.canvas.getContext("2d")!;
    texture: THREE.CanvasTexture;
    material: THREE.SpriteMaterial;
    sprite: THREE.Sprite;
    inScene = false;
    offset = new SolVec3(0, 2, 0);
    text = "Player";

    constructor(text: string = "Player") {
        super();
        // 1. Set internal canvas resolution
        this.canvas.width = 256;
        this.canvas.height = 64;

        // 2. Draw text
        this.context.font = "48px Arial";
        this.context.fillStyle = "white";
        this.context.textAlign = "center";

        this.context.fillText(text, 128, 48);

        // 3. Setup THREE objects
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.material = new THREE.SpriteMaterial({ map: this.texture });
        this.sprite = new THREE.Sprite(this.material);

        // 4. Scale sprite to match aspect ratio
        this.sprite.scale.set(2, 0.5, 1);
    }

    updateText(newText: string) {
        if (newText === this.text) return;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.fillText(newText, 128, 48);
        this.text = newText;
        this.texture.needsUpdate = true;
    }
}