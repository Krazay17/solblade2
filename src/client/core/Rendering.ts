import * as THREE from "three"
import { EffectComposer, RenderPass } from "three/examples/jsm/Addons.js";

export class Rendering {
    canvas: HTMLElement;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    dirLight: THREE.DirectionalLight;
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private renderPass: RenderPass;
    constructor(canvas: HTMLElement) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.set(2,2,2);
        this.camera.lookAt(new THREE.Vector3(0,0,0));
        this.scene.add(this.camera);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.composer = new EffectComposer(this.renderer);
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.addPasses();
        this.dirLight = this.lights();
        this.resize();

        window.addEventListener("resize", this.resize.bind(this));
    }
    render(dt: number) {
        if (this.composer) this.composer.render(dt)
    }
    private resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.composer.setSize(w, h);
        this.renderPass.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
    addPasses() {
        this.composer.addPass(this.renderPass);
    }
    lights() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const dirLight = new THREE.DirectionalLight(0xffeeee, .4);

        dirLight.position.set(0, 100, 0);
        const target = new THREE.Vector3().addVectors(dirLight.position, new THREE.Vector3(1, -1, 1).normalize())
        dirLight.lookAt(target);

        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 200;

        // menuSlider('Shadow Quality', 1, 10, 1, (value) => {
        //     dirLight.shadow.mapSize.width = 1024 * value;
        //     dirLight.shadow.mapSize.height = 1024 * value;
        //     if (dirLight.shadow.map) {
        //         dirLight.shadow.map.dispose();
        //         dirLight.shadow.map = null;
        //     }
        //     dirLight.shadow.needsUpdate = true;
        // })
        dirLight.shadow.mapSize.width = 1024 * 4;
        dirLight.shadow.mapSize.height = 1024 * 4;
        dirLight.shadow.bias = -0.0001;
        dirLight.shadow.normalBias = 0.02;

        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, .05);
        this.scene.add(ambientLight);

        return dirLight;
    }
}