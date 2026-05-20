import Experience from './Experience.js'
import * as THREE from 'three'

import explosionVertexShader from '../Shaders/explosion/explosion-vertex.glsl'
import explosionFragmentShader from '../Shaders/explosion/explosion-frag.glsl'

export default class Explosion {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.init()
    }


    init() {
        const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
        const sphereMaterial = new THREE.ShaderMaterial({
            vertexShader: explosionVertexShader,
            fragmentShader: explosionFragmentShader,
            uniforms:{
                uBaseTexture: {value: new THREE.TextureLoader().load('/noise/worley.jpg')},
            }
         })
        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        this.scene.add(this.sphere)
    }
}