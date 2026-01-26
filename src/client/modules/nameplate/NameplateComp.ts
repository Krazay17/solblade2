import { Component } from "#/common/core/ECS";
import * as THREE from "three"

export class NameplateComp extends Component {
    canvas: THREE.Sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            color: "red",
        })
    )
    inScene: boolean = false;
}