import Experience from "./Experience";
import * as THREE from "three"

import flashVertexShader from "../Shaders/weapons/flash-vertex.glsl"
import flashFragmentShader from "../Shaders/weapons/flash-frag.glsl"

export default class Weapon {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.flash()
    }

    flash() {
        const flashGeo = new THREE.PlaneGeometry(1,1)
        flashGeo.rotateX = -Math.PI/2
        const flashMat = new THREE.ShaderMaterial({
            uniforms:{
                uColor: {value: new THREE.Color("#e0af1e")} 
            },
            vertexShader: flashVertexShader,
            fragmentShader: flashFragmentShader,
        })
        this.flashMesh = new THREE.Mesh(flashGeo, flashMat)
        this.flashMesh.position.set(0, 1.5, -10)
        this.scene.add(this.flashMesh)
    }
}