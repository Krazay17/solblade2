import * as THREE from "three"

export class CWorld {
    testCube;
    constructor(private scene: THREE.Scene) {
        this.testCube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: "blue" })
        )
        this.scene.add(this.testCube);
    }

    tick(dt:number, time:number){
        this.testCube.rotateY(.001);
    }
}