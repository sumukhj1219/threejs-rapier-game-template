import Experience from "./Experience";
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

import blastVertexShader from '../Shaders/blast/blast-vertex.glsl'
import blastFragmentShader from '../Shaders/blast/blast-frag.glsl'
import gsap from 'gsap';
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

export default class Blast {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.physicsWorld = this.experience.world.physics.world
        this.init()
    }

    init() {
        const textureLoader = new THREE.TextureLoader()
        const blastTexture = textureLoader.load('/noise/perlin.png')

        const blastGeometry = new THREE.SphereGeometry(0.15, 128, 128)
        const blastMaterial = new THREE.ShaderMaterial({
            vertexShader: blastVertexShader,
            fragmentShader: blastFragmentShader,
            uniforms: {
                uStrength: { value: 1 },
                uTexture: { value: blastTexture },
                uTime: { value: 0 },
                uColorBright: { value: new THREE.Color("orange") },
                uColorDark: { value: new THREE.Color("white") },
            },
            side: THREE.DoubleSide,
        })
        this.blastMesh = new THREE.Mesh(blastGeometry, blastMaterial)
        this.scene.add(this.blastMesh)

        this.blastMesh.position.set(0, 1, 0)
    }

    explodeEffect() {
        const blastDuration = 1;

        const blastTimeline = gsap.timeline({
            onComplete: () => {
                this.scene.remove(this.blastMesh);
            }
        });

        blastTimeline.to(this.blastMesh.scale, {
            x: 5,
            y: 5,
            z: 5,
            duration: blastDuration,
            ease: "power2.out"
        }, 0);
    }

    update() {
        this.blastMesh.material.uniforms.uTime.value += 0.01;
        this.explodeEffect()
    }
}