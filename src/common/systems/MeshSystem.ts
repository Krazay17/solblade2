import * as THREE from "three";

export class MeshSystem {
    entities: Map<string, THREE.Mesh> = new Map();
    update(dt: number) {
        this.entities.forEach(e => {
            //e.position.lerp()
        });
    }
}