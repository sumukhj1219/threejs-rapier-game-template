import Experience from "./Experience";
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

import blastVertexShader from '../Shaders/blast/blast-vertex.glsl'
import blastFragmentShader from '../Shaders/blast/blast-frag.glsl'
import gsap from 'gsap';

export default class Blast {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.spheres = [] 
        this.group = new THREE.Group()
        this.scene.add(this.group)


        this.init()
    }

    init() {
        const textureLoader = new THREE.TextureLoader()
        const blastTexture = textureLoader.load('/noise/perlin.png')

        const blastGeometry = new THREE.SphereGeometry(0.15, 64, 64)

        for (let i = 0; i < 10; i++) {
            const blastMaterial = new THREE.ShaderMaterial({
                vertexShader: blastVertexShader,
                fragmentShader: blastFragmentShader,
                uniforms: {
                    uStrength: { value: 1 },
                    uTexture: { value: blastTexture },
                    uTime: { value: Math.random() * 0.05 * i },
                    uColorBright: { value: new THREE.Color("#ff6600") },
                    uColorDark: { value: new THREE.Color("#cc0000") },
                    uBloom: { value: 5.0 }
                },
                blending: 2,
                depthWrite: false,
                side: THREE.DoubleSide,
            })
            

            const mesh = new THREE.Mesh(blastGeometry, blastMaterial)

            mesh.position.x = (Math.random() - 0.5) * 0.5
            mesh.position.y = (Math.random() - 0.5) * 0.5
            mesh.position.z = (Math.random() - 0.5) * 0.5

            mesh.scale.set(0.01 * i, 0.01 * i, 0.01 * i)
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
            this.group.add(mesh)
            this.spheres.push(mesh)
        }

        this.group.position.set(0, 5, 0)
        this.explodeEffect();
    }

    explodeEffect() {
        if (this.isExploding) return;
        this.isExploding = true;

        const blastDuration = 1.5;
        const tl = gsap.timeline({
            onComplete: () => { this.scene.remove(this.group); }
        });

        this.spheres.forEach((sphere) => {
            tl.to(sphere.scale, {
                x: 6,
                y: 6,
                z: 6,
                duration: 0.4,
                ease: "expo.out"
            }, 0);

            tl.to(sphere.scale, {
                x: 8,
                y: 8,
                z: 8,
                duration: blastDuration - 0.4,
                ease: "linear"
            }, 0.4);

            tl.to(sphere.material.uniforms.uStrength, {
                value: 0,
                duration: blastDuration,
                ease: "power1.inOut"
            }, 0);
        });
    }

    update() {
        this.spheres.forEach(sphere => {
            sphere.material.uniforms.uTime.value += 0.01;
        });
        this.group.position.y += 0.005;
    }
}