import Experience from "./Experience.js"
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

import blastVertexShader from '../Shaders/blast/blast-vertex.glsl'
import blastFragmentShader from '../Shaders/blast/blast-frag.glsl'
import waveVertexShader from '../Shaders/waveImpact/waveImpact-vertex.glsl'
import waveFragmentShader from '../Shaders/waveImpact/waveImpact-frag.glsl'
import smokeVertexShader from "../Shaders/smoke/smoke-vertex.glsl"
import smokeFragmentShader from "../Shaders/smoke/smoke-frag.glsl"

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
        const spikeTexture = textureLoader.load("/noise/vornoi.jpg")
        const waveTexture = textureLoader.load('/noise/perlin.png')
        const smokeTexture = textureLoader.load("/noise/fractal.jpg")

        const blastGeometry = new THREE.SphereGeometry(0.15, 64, 64)

        for (let i = 0; i < 10; i++) {
            const blastMaterial = new THREE.ShaderMaterial({
                vertexShader: blastVertexShader,
                fragmentShader: blastFragmentShader,
                uniforms: {
                    uStrength: { value: 1 },
                    uTexture: { value: blastTexture },
                    uSpikeTexture: { value: spikeTexture },
                    uTime: { value: Math.random() * 0.05 * i },
                    uColorBright: { value: new THREE.Color("#ff6600") },
                    uColorDark: { value: new THREE.Color("#221f1f") },
                },
                blending: THREE.AdditiveBlending,
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

        const particleCount = 200 
        const particleGeometry = new THREE.BufferGeometry()
        
        const positions = new Float32Array(particleCount * 3)
        const sizes = new Float32Array(particleCount) 
        this.particleVelocities = [] 

        for(let i = 0; i < particleCount; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 0.2
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2

            const theta = Math.random() * Math.PI * 2
            const phi = Math.acos((Math.random() * 2) - 1)
            
            const speed = Math.pow(Math.random(), 2.0) * 16.0 + 2.0 

            this.particleVelocities.push(new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + (Math.random() * 3.0), 
                Math.cos(phi) * speed
            ))

            sizes[i] = Math.random() * 1.5 + 0.2
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

        this.particleMaterial = new THREE.PointsMaterial({
            color: new THREE.Color("#ffdd66"),
            size: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
        })

        this.sparkParticles = new THREE.Points(particleGeometry, this.particleMaterial)
        this.group.add(this.sparkParticles)

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
            depthWrite: false,
            side: THREE.DoubleSide,
        })
        this.impactMesh = new THREE.Mesh(impactGeometry, impactMaterial)
        this.impactMesh.rotation.x = -Math.PI / 2
        this.group.add(this.impactMesh)

        const smokeGeometry = new THREE.PlaneGeometry(6, 6, 64, 64)
        smokeGeometry.rotateX(-Math.PI / 2) 
        
        const smokeMaterial = new THREE.ShaderMaterial({
            vertexShader: smokeVertexShader,
            fragmentShader: smokeFragmentShader,
            uniforms: {
                uSmokeTexture: { value: smokeTexture },
                uTime: { value: 0 },
                uProgress: { value: 0 } 
            },
            blending: THREE.NormalBlending, 
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        })
        this.smokeMesh = new THREE.Mesh(smokeGeometry, smokeMaterial)
        this.group.add(this.smokeMesh)

        this.group.position.copy(this.blastPosition)
        this.explodeEffect();
    }

    explodeEffect() {
        if (this.isExploding) return;
        this.isExploding = true;

        const blastDuration = 0.5;
        const smokeDuration = 1.5; 

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
            tl.to(sphere.scale, { x: 6, y: 6, z: 6, duration: 0.3, ease: "expo.out" }, 0);
            tl.to(sphere.scale, { x: 8, y: 8, z: 8, duration: blastDuration - 0.3, ease: "power1.in" }, 0.3);
            tl.to(sphere.material.uniforms.uStrength, { value: 0, duration: blastDuration, ease: "power1.inOut" }, 0);
        });

        if (this.impactMesh) {
            tl.to(this.impactMesh.material.uniforms.uProgress, { value: 1.0, duration: blastDuration, ease: "power2.out" }, 0);
            tl.to(this.impactMesh.scale, { x: 2.0, y: 2.0, duration: blastDuration, ease: "expo.out" }, 0);
        }

        if (this.particleMaterial) {
            tl.to(this.particleMaterial, { 
                opacity: 0, 
                size: 0.1, 
                duration: blastDuration, 
                ease: "power1.in" 
            }, 0);
        }

        if (this.smokeMesh) {
            tl.to(this.smokeMesh.material.uniforms.uProgress, { value: 1.0, duration: smokeDuration, ease: "power2.out" }, 0);
            tl.to(this.smokeMesh.scale, { x: 2.5, y: 2.5, duration: smokeDuration, ease: "quad.out" }, 0);
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

        if (this.smokeMesh && this.smokeMesh.material) {
            this.smokeMesh.material.uniforms.uTime.value += 0.01;
        }

        if (this.sparkParticles && this.isExploding) {
            const positionAttribute = this.sparkParticles.geometry.attributes.position;
            const positions = positionAttribute.array;

            for (let i = 0; i < this.particleVelocities.length; i++) {
                const velocity = this.particleVelocities[i];

                positions[i * 3 + 0] += velocity.x * 0.016;
                positions[i * 3 + 1] += velocity.y * 0.016;
                positions[i * 3 + 2] += velocity.z * 0.016;

                positions[i * 3 + 0] += Math.sin(this.experience.time?.elapsed * 0.05 + i) * 0.01;
                positions[i * 3 + 2] += Math.cos(this.experience.time?.elapsed * 0.05 + i) * 0.01;

                velocity.y -= 0.25; 
                velocity.multiplyScalar(0.94); 
            }

            positionAttribute.needsUpdate = true;
        }
    }
}