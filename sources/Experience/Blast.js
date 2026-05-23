import Experience from "./Experience";
import * as THREE from "three"
import blastVertexShader from '../Shaders/blast/blast-vertex.glsl'
import blastFragmentShader from '../Shaders/blast/blast-frag.glsl'
import waveVertexShader from '../Shaders/waveImpact/waveImpact-vertex.glsl'
import waveFragmentShader from '../Shaders/waveImpact/waveImpact-frag.glsl'
import gsap from 'gsap';

export default class Blast {
    constructor(position) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.spikes = []
        this.group = new THREE.Group()
        this.scene.add(this.group)
        this.blastPosition = position

        this.init()
    }

    init() {
        const textureLoader = new THREE.TextureLoader()
        const blastTexture = textureLoader.load('/noise/fractal.jpg')
        const impactTexture = textureLoader.load('/noise/perlin.png')

        const spikeGeometry = new THREE.CylinderGeometry(0.03, 0.05, 1.2, 10, 4, true)
        spikeGeometry.rotateX(Math.PI / 2)
        spikeGeometry.translate(0, 0, 0.6)
        const spikeCount = 24;

        for (let i = 0; i < spikeCount; i++) {
            const blastMaterial = new THREE.ShaderMaterial({
                vertexShader: blastVertexShader,
                fragmentShader: blastFragmentShader,
                uniforms: {
                    uProgress: { value: 0 }, 
                    uTexture: { value: blastTexture },
                    uTime: { value: Math.random() * 100 },
                    uColorBright: { value: new THREE.Color("#08d3f7") },
                    uColorMid: { value: new THREE.Color("#f2e608") },   
                    uColorDark: { value: new THREE.Color("#ec0ba5") },   
                },
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            })
            
            const mesh = new THREE.Mesh(spikeGeometry, blastMaterial)
            const phi = (i / spikeCount) * Math.PI * 2
            const tilt = (Math.random() - 0.5) * 0.35
            const lengthFactor = 0.8 + Math.random() * 0.55

            mesh.rotation.y = phi
            mesh.rotation.x = tilt
            mesh.rotation.z = (Math.random() - 0.5) * 0.25
            mesh.position.set(0, 0, 0)
            mesh.scale.set(1, 1, lengthFactor)
            mesh.userData.lengthFactor = lengthFactor
            
            this.group.add(mesh)
            this.spikes.push(mesh)
        }

        const impactGeometry = new THREE.RingGeometry(0.15, 5, 64)
        const impactMaterial = new THREE.ShaderMaterial({
            vertexShader: waveVertexShader,
            fragmentShader: waveFragmentShader,
            uniforms: {
                uProgress: { value: 0 },
                uTexture: { value: impactTexture },
                uTime: { value: 0 },
                uColorBright: { value: new THREE.Color("#08d3f7") },
                uColorMid: { value: new THREE.Color("#f2e608") },
                uColorDark: { value: new THREE.Color("#ec0ba5") },
            },
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
        this.impactMesh = new THREE.Mesh(impactGeometry, impactMaterial)
        this.group.add(this.impactMesh)

        this.group.position.copy(this.blastPosition)
        this.explodeEffect();
    }

    explodeEffect() {
        if (this.isExploding) return;
        this.isExploding = true;

        const tl = gsap.timeline({
            onComplete: () => { 
                this.scene.remove(this.group); 
                this.group.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            if (child.material.map) child.material.map.dispose();
                            child.material.dispose();
                        }
                    }
                });
            }
        });

        const duration = 0.5;

        this.spikes.forEach((spike) => {
            tl.to(spike.scale, {
                x: 1.0, y: 1.0, z: spike.userData.lengthFactor * 2.5, duration: duration * 0.35, ease: "power4.out"
            }, 0);

            tl.to(spike.scale, {
                x: 0, y: 0, z: 0, duration: duration * 0.55, ease: "power2.in"
            }, duration * 0.3);

            tl.to(spike.material.uniforms.uProgress, {
                value: 1.0, duration: duration, ease: "linear"
            }, 0);
        });

        // Fast expanding ring wave
        tl.to(this.impactMesh.scale, {
            x: 3.5, y: 3.5, duration: duration * 0.8, ease: "expo.out"
        }, 0);

        tl.to(this.impactMesh.material.uniforms.uProgress, {
            value: 1.0, duration: duration * 0.8, ease: "power2.out"
        }, 0);

    }

    update() {
        this.spikes.forEach(spike => {
            spike.material.uniforms.uTime.value += 0.02;
        });

        if (this.impactMesh) {
            this.impactMesh.material.uniforms.uTime.value += 0.035;
        }
    }
}
