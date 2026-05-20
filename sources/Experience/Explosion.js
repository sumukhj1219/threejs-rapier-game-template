import Experience from './Experience.js'
import * as THREE from 'three'
import explosionVertexShader from '../Shaders/explosion/explosion-vertex.glsl'
import explosionFragmentShader from '../Shaders/explosion/explosion-frag.glsl'

export default class Explosion {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.elapsed = 0.0
        this.duration = 0.4
        this.isFinished = false

        this.init()
    }

    init() {
        // Flash
        const sphereGeometry = new THREE.SphereGeometry(1, 128, 128)
        const textureLoader = new THREE.TextureLoader()
        const vertNoiseTex = textureLoader.load('/noise/worley.jpg')
        vertNoiseTex.wrapS = vertNoiseTex.wrapT = THREE.RepeatWrapping
        const sphereMaterial = new THREE.ShaderMaterial({
            vertexShader: explosionVertexShader,
            fragmentShader: explosionFragmentShader,
            side: THREE.DoubleSide,
            blending: 2,
            uniforms: {
                uBaseTexture: { value: vertNoiseTex },
                uTime: { value: 0 },
                uGrowth: { value: 1 },
                uSpikeLength: { value: 0.25 },
                uRandomSeed: { value: 100 * Math.random() },
            }
        })
        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)



        this.scene.add(this.sphere)
    }

    update() {
        if (this.isFinished) return

        this.elapsed += 0.016

        let progress = Math.min(this.elapsed / this.duration, 1.0)

        let flashyTime = 1.0 - Math.pow(1.0 - progress, 5.0)

        this.sphere.material.uniforms.uTime.value = flashyTime

        if (progress >= 1.0) {
            this.isFinished = true
            this.destroy()
        }
    }

    destroy() {
        this.scene.remove(this.sphere)
        this.sphere.geometry.dispose()
        this.sphere.material.dispose()
    }
}