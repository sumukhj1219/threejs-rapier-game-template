import Experience from "./Experience";
import * as THREE from "three"

import portalVertexShader from "../Shaders/portal/portal-vertex.glsl"
import portalFragmentShader from "../Shaders/portal/portal-frag.glsl"

export default class Portal {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.init()
    }

    init() {
        const textureLoader = new THREE.TextureLoader()
        const portalTexture = textureLoader.load("/noise/fractal.jpg")

        const planeGeometry = new THREE.PlaneGeometry(1, 1, 132, 132)
        const planeMaterial = new THREE.ShaderMaterial({
            vertexShader: portalVertexShader,
            fragmentShader: portalFragmentShader,
            uniforms:{
                uTime:{value: 2.0},
                uTexture:{value: portalTexture},
            },
            side: THREE.DoubleSide,
            transparent: true
        })
        this.portalMesh = new THREE.Mesh(planeGeometry, planeMaterial)
        this.scene.add(this.portalMesh)
    }

    update() {
        if(this.portalMesh) {
            this.portalMesh.material.uniforms.uTime.value += 0.01
        }
    }
}