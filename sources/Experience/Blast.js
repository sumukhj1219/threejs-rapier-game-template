import Experience from "./Experience";
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

import blastVertexShader from '../Shaders/blast/blast-vertex.glsl'
import blastFragmentShader from '../Shaders/blast/blast-frag.glsl'
import waveVertexShader from '../Shaders/waveImpact/waveImpact-vertex.glsl'
import waveFragmentShader from '../Shaders/waveImpact/waveImpact-frag.glsl'
import gsap from 'gsap';

export default class Blast {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.spheres = [] 
        this.group = new THREE.Group()
        this.scene.add(this.group)

        // accept either a Vector3, an object with x/y/z, or an options object { position }
        this.impactPosition = null
        if (_options) {
            // if a THREE.Vector3
            if (_options.isVector3) {
                this.impactPosition = _options.clone()
            } else if (_options.position && _options.position.isVector3) {
                this.impactPosition = _options.position.clone()
            } else if (typeof _options.x === 'number' && typeof _options.y === 'number' && typeof _options.z === 'number') {
                this.impactPosition = new THREE.Vector3(_options.x, _options.y, _options.z)
            }
        }

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
                    uStrength: { value: 1 },
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

            mesh.position.x = (Math.random() - 0.15) * 0.5
            mesh.position.y = (Math.random() - 0.15) * 0.5
            mesh.position.z = (Math.random() - 0.15) * 0.5

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
                uTexture: { value:  waveTexture},
            },
            blending: THREE.AdditiveBlending,
            depthWrite: false,  
            side: THREE.DoubleSide,
        })
        this.impactMesh = new THREE.Mesh(impactGeometry, impactMaterial)
        this.impactMesh.rotation.x = -Math.PI / 2
        this.group.add(this.impactMesh)

        // position the blast at the impact position if provided, otherwise default above ground
        if (this.impactPosition) {
            this.group.position.copy(this.impactPosition)
        } else {
            this.group.position.set(0, 5, 0)
        }
        this.explodeEffect();
    }

    explodeEffect() {
        if (this.isExploding) return;
        this.isExploding = true;

        const blastDuration = 0.75;
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
        this.impactMesh.material.uniforms.uTime.value += 0.01;
        this.group.position.y += 0.005;
    }
}