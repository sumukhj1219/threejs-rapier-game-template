import Experience from "./Experience";
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

import blastVertexShader from '../Shaders/blast/blast-vertex.glsl'
import blastFragmentShader from '../Shaders/blast/blast-frag.glsl'
import waveVertexShader from '../Shaders/waveImpact/waveImpact-vertex.glsl'
import waveFragmentShader from '../Shaders/waveImpact/waveImpact-frag.glsl'
import gsap from 'gsap';

export default class Blast {
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
        const blastTexture = textureLoader.load('/noise/vornoi.jpg')
        const waveTexture = textureLoader.load('/noise/vornoi.jpg')

        const blastGeometry = new THREE.SphereGeometry(0.15, 64, 64)

        for (let i = 0; i < 100; i++) {
            const blastMaterial = new THREE.ShaderMaterial({
                vertexShader: blastVertexShader,
                fragmentShader: blastFragmentShader,
                uniforms: {
                    uStrength: { value: 5 },
                    uTexture: { value: blastTexture },
                    uTime: { value: Math.random() },
                    uColorBright: { value: new THREE.Color("#ff6600") },
                    uColorDark: { value: new THREE.Color("#c24f07") },
                },
                blending: THREE.AdditiveBlending,
                // transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            })

            const mesh = new THREE.Mesh(blastGeometry, blastMaterial)

            const distance = 2.5; 
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);

            mesh.position.x = distance * Math.sin(theta) * Math.cos(phi);
            mesh.position.y = distance * Math.sin(theta) * Math.sin(phi);
            mesh.position.z = distance * Math.cos(theta);

            mesh.scale.set(0.01 * i, 0.01 * i, 0.01 * i)
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
                uTexture: { value: waveTexture },
            },
            blending: THREE.AdditiveBlending,
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

        const blastDuration = 1;
        const tl = gsap.timeline({
            onComplete: () => { this.scene.remove(this.group); }
        });


        this.spheres.forEach((sphere) => {
            tl.to(sphere.scale, {
                x: 12,
                y: 12,
                z: 12,
                duration: 0.4,
                ease: "expo.out"
            }, 0);

            tl.to(sphere.scale, {
                x: 14,
                y: 14,
                z: 14,
                duration: blastDuration - 0.2,
                ease: "linear"
            }, 0.2);

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
        this.impactMesh.material.uniforms.uTime.value += 0.01;
        this.group.position.y += 0.005;
    }
}