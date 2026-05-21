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
        this.spheres = []
        this.group = new THREE.Group()
        this.scene.add(this.group)
        this.blastPosition = position
        this.textMesh = null
        this.textTargetRotationZ = 0;

        this.init()
    }

    init() {
        const textureLoader = new THREE.TextureLoader()
        const blastTexture = textureLoader.load('/noise/vornoi.jpg')

        const blastGeometry = new THREE.SphereGeometry(0.5, 16, 16)
        const sparkCount = 15; 

        for (let i = 0; i < sparkCount; i++) {
            const blastMaterial = new THREE.ShaderMaterial({
                vertexShader: blastVertexShader,
                fragmentShader: blastFragmentShader,
                uniforms: {
                    uProgress: { value: 0 }, 
                    uTexture: { value: blastTexture },
                    uTime: { value: Math.random() * 100 },
                    uColorBright: { value: new THREE.Color("#f4a508") },
                    uColorMid: { value: new THREE.Color("#ea2886") },   
                    uColorDark: { value: new THREE.Color("#1bb8d7") },   
                },
                transparent: true,
                depthWrite: false,
                side: THREE.DoubleSide,
            })
            
            const mesh = new THREE.Mesh(blastGeometry, blastMaterial)
            const distance = Math.random() * 1.5 + 0.5; 
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);

            mesh.userData = {
                targetX: distance * Math.sin(theta) * Math.cos(phi),
                targetY: distance * Math.sin(theta) * Math.sin(phi),
                targetZ: distance * Math.cos(theta)
            }

            mesh.scale.set(0.1, 0.1, 0.1)
            mesh.lookAt(mesh.userData.targetX, mesh.userData.targetY, mesh.userData.targetZ);
            
            this.group.add(mesh)
            this.spheres.push(mesh)
        }

        const impactGeometry = new THREE.RingGeometry(0.1, 5, 32)
        const impactMaterial = new THREE.ShaderMaterial({
            vertexShader: waveVertexShader,
            fragmentShader: waveFragmentShader,
            uniforms: {
                uProgress: { value: 0 },
                uTexture: { value: blastTexture },
            },
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
        this.impactMesh = new THREE.Mesh(impactGeometry, impactMaterial)
        this.group.add(this.impactMesh)

        this.group.position.copy(this.blastPosition)

        textureLoader.load('/assets/collage.jpg', (pngTexture) => {
            const textGeometry = new THREE.PlaneGeometry(2.0, 1.0);
            const textMaterial = new THREE.MeshBasicMaterial({
                map: pngTexture,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
            });

            this.textMesh = new THREE.Mesh(textGeometry, textMaterial);
            this.textMesh.position.y = 0.6; 
            this.textMesh.scale.set(0, 0, 0); 
            
            this.group.add(this.textMesh);

            this.explodeEffect();
        });
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

        this.spheres.forEach((sphere) => {
            tl.to(sphere.position, {
                x: sphere.userData.targetX, y: sphere.userData.targetY, z: sphere.userData.targetZ,
                duration: duration, ease: "expo.out"
            }, 0);

            tl.to(sphere.scale, {
                x: 3.0, y: 3.0, z: 6.0, duration: duration * 0.3, ease: "power4.out"
            }, 0);

            tl.to(sphere.scale, {
                x: 0, y: 0, z: 0, duration: duration * 0.7, ease: "power2.in"
            }, duration * 0.3);

            tl.to(sphere.material.uniforms.uProgress, {
                value: 1.0, duration: duration, ease: "linear"
            }, 0);
        });

        // Fast expanding ring wave
        tl.to(this.impactMesh.scale, {
            x: 2.5, y: 2.5, duration: duration * 0.8, ease: "expo.out"
        }, 0);

        tl.to(this.impactMesh.material.uniforms.uProgress, {
            value: 1.0, duration: duration * 0.8, ease: "power2.out"
        }, 0);

        // --- SNAPPY PNG POP ---
        if (this.textMesh) {
            tl.to(this.textMesh.scale, {
                x: 1.3,
                y: 1.3,
                z: 1.3,
                duration: duration * 0.25,
                ease: "back.out(2.5)"
            }, 0);

            this.textTargetRotationZ = (Math.random() - 0.5) * 0.3;
            tl.to(this, {
                textTargetRotationZ: this.textTargetRotationZ,
                duration: duration * 0.25,
                ease: "power2.out"
            }, 0);

            tl.to(this.textMesh.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: duration * 0.4,
                ease: "power3.in"
            }, duration * 0.6);
        }
    }

    update() {
        this.spheres.forEach(sphere => {
            sphere.material.uniforms.uTime.value += 0.02;
        });

        if (this.textMesh && this.experience.camera) {
            this.textMesh.quaternion.copy(this.experience.camera.instance.quaternion);
            this.textMesh.rotateZ(this.textTargetRotationZ);
        }
    }
}