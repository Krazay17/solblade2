import * as THREE from "three"
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { EffectComposer, GLTFLoader, RenderPass } from "three/examples/jsm/Addons.js";

type MeshCacheEntry = {
    scene: THREE.Object3D;
    animations: THREE.AnimationClip[];
};

export class Rendering {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    dirLight: THREE.DirectionalLight;
    glLoader = new GLTFLoader();
    private meshCache = new Map<string, MeshCacheEntry>();
    private loadingCache = new Map<string, Promise<MeshCacheEntry | undefined>>();
    private renderer: THREE.WebGLRenderer;
    private composer: EffectComposer;
    private renderPass: RenderPass;

    constructor(private canvas: HTMLElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 3000);
        this.camera.position.set(0,0,5);
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

    async loadMap(name: string) {
        const map = (await this.glLoader.loadAsync(`assets/models/${name}.glb`)).scene;
        if (!map) return;
        this.scene.add(map);
    }

    async createMesh(name: string): Promise<THREE.Object3D | undefined> {
        // 1. If it's already fully loaded, return a clone immediately
        const cached = this.meshCache.get(name);
        if (cached) {
            return this.prepareClone(cached);
        }

        // 2. If loading, wait for the existing promise
        const loading = this.loadingCache.get(name);
        if (loading) {
            const result = await loading;
            return result ? this.prepareClone(result) : undefined;
        }

        // 3. Start a new load
        const loadPromise = (async (): Promise<MeshCacheEntry | undefined> => {
            try {
                let scene: THREE.Object3D;
                let animations: THREE.AnimationClip[] = [];

                if (name === "cube") {
                    scene = new THREE.Mesh(
                        new THREE.BoxGeometry(),
                        new THREE.MeshBasicMaterial({ color: "blue" })
                    );
                } else {
                    const glb = await this.glLoader.loadAsync(`assets/models/${name}.glb`);
                    scene = glb.scene;
                    animations = glb.animations; // Store clips here
                }

                const entry = { scene, animations };
                this.meshCache.set(name, entry);
                return entry;
            } catch (err) {
                console.error(`Failed to load mesh: ${name}`, err);
                return undefined;
            } finally {
                this.loadingCache.delete(name);
            }
        })();

        this.loadingCache.set(name, loadPromise);
        const finalEntry = await loadPromise;
        return finalEntry ? this.prepareClone(finalEntry) : undefined;

    }

    private prepareClone(entry: MeshCacheEntry): THREE.Object3D {
        // SkeletonUtils.clone is essential for skinned meshes (characters)
        const clone = SkeletonUtils.clone(entry.scene);

        // Attach the animations array to the clone so AnimationSystem can see it
        (clone as any).animations = entry.animations;

        return clone;
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
