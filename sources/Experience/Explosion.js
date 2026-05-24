import Experience from "./Experience.js"
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

import blastVertexShader from '../Shaders/blast/blast-vertex.glsl'
import blastFragmentShader from '../Shaders/blast/blast-frag.glsl'
import waveVertexShader from '../Shaders/waveImpact/waveImpact-vertex.glsl'
import waveFragmentShader from '../Shaders/waveImpact/waveImpact-frag.glsl'
import gsap from 'gsap';

export default class Explosion {
    constructor(position) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.spheres = []
        this.group = new THREE.Group()
        this.scene.add(this.group)
        this.blastPosition = position

        this.init()
    }

    init() {
        const textureLoader = new THREE.TextureLoader()
        const blastTexture = textureLoader.load('/noise/perlin.png')
        const waveTexture = textureLoader.load('/noise/perlin.png')

        const blastGeometry = new THREE.SphereGeometry(0.15, 64, 64)

        for (let i = 0; i < 10; i++) {
            const blastMaterial = new THREE.ShaderMaterial({
                vertexShader: blastVertexShader,
                fragmentShader: blastFragmentShader,
                uniforms: {
                    uStrength: { value: 1.0 },
                    uTexture: { value: blastTexture },
                    uTime: { value: Math.random() * 0.05 * i },
                    uColorBright: { value: new THREE.Color("#ff6600") },
                    uColorDark: { value: new THREE.Color("#cc0000") },
                },
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            })

            const mesh = new THREE.Mesh(blastGeometry, blastMaterial)

            mesh.position.x = (Math.random() - 0.5) * 0.5
            mesh.position.y = (Math.random() - 0.5) * 0.5
            mesh.position.z = (Math.random() - 0.5) * 0.5

            const initialScale = 0.05 * (i + 1)
            mesh.scale.set(initialScale, initialScale, initialScale)
            mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)

            this.group.add(mesh)
            this.spheres.push(mesh)
        }

        const impactGeometry = new THREE.PlaneGeometry(10, 10, 64, 64)
        const impactMaterial = new THREE.ShaderMaterial({
            vertexShader: waveVertexShader,
            fragmentShader: waveFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 }, 
                uTexture: { value: waveTexture },
            },
            blending: THREE.AdditiveBlending,
            transparent: true, 
            depthWrite: false,
            side: THREE.DoubleSide,
        })
        this.impactMesh = new THREE.Mesh(impactGeometry, impactMaterial)
        this.impactMesh.rotation.x = -Math.PI / 2
        this.group.add(this.impactMesh)

        this.group.position.copy(this.blastPosition)
        this.explodeEffect();
    }

    explodeEffect() {
        if (this.isExploding) return;
        this.isExploding = true;

        const blastDuration = 0.75;
        const tl = gsap.timeline({
            onComplete: () => {
                this.scene.remove(this.group);
                this.group.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        });

        this.spheres.forEach((sphere) => {
            tl.to(sphere.scale, {
                x: 6, y: 6, z: 6,
                duration: 0.3,
                ease: "expo.out"
            }, 0);

            tl.to(sphere.scale, {
                x: 8, y: 8, z: 8,
                duration: blastDuration - 0.3,
                ease: "power1.in"
            }, 0.3);

            tl.to(sphere.material.uniforms.uStrength, {
                value: 0,
                duration: blastDuration,
                ease: "power1.inOut"
            }, 0);
        });

        if (this.impactMesh) {
            tl.to(this.impactMesh.material.uniforms.uProgress, {
                value: 1.0,
                duration: blastDuration,
                ease: "power2.out"
            }, 0);

            tl.to(this.impactMesh.scale, {
                x: 2.0,
                y: 2.0,
                duration: blastDuration,
                ease: "expo.out"
            }, 0);
        }
    }

    update() {
        this.spheres.forEach(sphere => {
            if (sphere.material && sphere.material.uniforms) {
                sphere.material.uniforms.uTime.value += 0.01;
            }
        });

        if (this.impactMesh && this.impactMesh.material) {
            this.impactMesh.material.uniforms.uTime.value += 0.01;
        }

    }
}