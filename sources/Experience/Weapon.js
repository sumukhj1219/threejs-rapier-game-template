import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Experience from './Experience';
import flashVertexShader from "../Shaders/weapons/flash-vertex.glsl"
import flashFragShader from "../Shaders/weapons/flash-frag.glsl"
import gsap from 'gsap';
import Blast from './Blast';

export default class Weapon {
    static instance

    constructor() {
        if (Weapon.instance) {
            return Weapon.instance
        }
        Weapon.instance = this

        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.camera = this.experience.camera.instance;

        const oldContainer = this.camera.getObjectByName("weaponContainer");
        if (oldContainer) this.camera.remove(oldContainer);

        this.container = new THREE.Group();
        this.container.name = "weaponContainer";

        this.bullets = [];
        this.maxAmmo = 10;
        this.currentAmmo = this.maxAmmo;

        this.init();
        this.setupEventListeners();
        this.createCrosshair()

    }

    init() {
        const loader = new GLTFLoader();
        loader.load("/model/gun.glb", (gltf) => {
            this.gun = gltf.scene;
            this.gun.scale.set(0.5, 0.5, 0.5);
            this.gun.position.set(0.2, -0.4, -1.5);
            this.gun.rotation.y = -Math.PI / 2;

            this.gun.traverse((node) => {
                if (node.isMesh && node.material) {
                    node.material.roughness = 0.1;
                    node.material.metalness = 1;
                }
            });
            this.gun.castShadow = true;
            this.gun.receiveShadow = true;

            this.container.add(this.gun);
            this.camera.add(this.container);
            if (!this.camera.parent) this.scene.add(this.camera);
        });
    }

    setupEventListeners() {
        window.addEventListener('mousedown', () => {
            this.fire();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'r') this.reload();
        });
    }

    breathe() {
        const elapsed = this.experience.time.elapsed * 0.002;
        const movement = Math.sin(elapsed) * 0.002;

        this.container.position.y = movement;

        this.container.rotation.z = Math.sin(elapsed * 0.05) * 0.01;
    }

    slidePose() {
        const player = this.experience.world?.player
        const sliding = Boolean(player && player.sliding)

        const targetZ = sliding ? -0.2 : 0
        const targetRotX = sliding ? 0.3 : 0
        const targetRotZ = sliding ? 0.2 : 0

        this.container.position.z = THREE.MathUtils.lerp(this.container.position.z, targetZ, 0.15)
        this.container.rotation.x = THREE.MathUtils.lerp(this.container.rotation.x, targetRotX, 0.15)
        this.container.rotation.z = THREE.MathUtils.lerp(this.container.rotation.z, targetRotZ, 0.15)
    }

    sprintPose() {
        const player = this.experience.world?.player
        const sprinting = Boolean(player && player.isSprinting)

        const targetY = sprinting ? -0.7 : -0.4
        const targetRotX = sprinting ? 0.25 : 0

        this.container.position.y = THREE.MathUtils.lerp(this.container.position.y, targetY, 0.12)
        this.container.rotation.x = THREE.MathUtils.lerp(this.container.rotation.x, targetRotX, 0.12)
    }

    createCrosshair() {
        if (document.querySelector('.cod-crosshair')) return;

        const crosshair = document.createElement('div');
        crosshair.classList.add('cod-crosshair');

        const parts = ['top', 'bottom', 'left', 'right', 'dot'];
        parts.forEach(part => {
            const div = document.createElement('div');
            div.classList.add(part);
            crosshair.appendChild(div);
        });

        document.body.appendChild(crosshair);
        this.crosshairElement = crosshair;
    }

    reload() {
        if (this.isReloading) return;
        this.isReloading = true;

        const tl = gsap.timeline({
            onComplete: () => { this.isReloading = false; }
        });

        tl.to(this.container.position, {
            y: -0.4,
            duration: 0.3,
            ease: "power2.inOut"
        });

        tl.to(this.container.rotation, {
            x: Math.PI / 8,
            duration: 0.65,
            ease: "power2.inOut"
        }, "<");

        tl.to(this.container.rotation, {
            z: -Math.PI / 2,
            duration: 0.65,
            ease: "power2.inOut"
        }, "<");

        tl.to(this.container.position, {
            z: 1.25,
            duration: 0.65,
            ease: "power2.inOut"
        }, "<");


        tl.add(() => { this.currentAmmo = this.maxAmmo; }, "+=0.1");

        tl.to(this.container.position, {
            y: 0,
            duration: 0.2,
            ease: "back.out(1.7)"
        });

        tl.to(this.container.rotation, {
            x: 0,
            duration: 0.2,
            ease: "power2.out"
        }, "<");
    }


    flashMuzzle() {
        const geometry = new THREE.PlaneGeometry(0.5, 0.5);
        const material = new THREE.ShaderMaterial({
            vertexShader: flashVertexShader,
            fragmentShader: flashFragShader,
            transparent: true,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uColor: { value: new THREE.Color("#ff1100") },
                uStrength: { value: 1.0 }
            }
        });

        const flash = new THREE.Mesh(geometry, material);

        flash.position.set(0.2, -0.3, -2.5);
        this.container.add(flash);

        const duration = 50;
        setTimeout(() => {
            this.container.remove(flash);
            geometry.dispose();
            material.dispose();
        }, duration);
    }

    fire() {
        if (this.currentAmmo <= 0) return;
        this.currentAmmo--;

        this.blast = new Blast()
        const bulletGroup = new THREE.Group();

        const coreGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.8);
        coreGeom.rotateX(Math.PI / 2);
        const coreMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
        const core = new THREE.Mesh(coreGeom, coreMat);

        const glowGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.85);
        glowGeom.rotateX(Math.PI / 2);
        const glowMat = new THREE.MeshBasicMaterial({
            color: "#ff0000",
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);

        bulletGroup.add(core, glow);

        bulletGroup.position.set(0.2, -0.3, -1.5);
        this.container.add(bulletGroup);

        this.bullets.push({
            mesh: bulletGroup,
            velocity: new THREE.Vector3(0, 0, -3.0)
        });

        this.flashMuzzle();
    }

    update() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];

            b.mesh.position.add(b.velocity);

            if (b.mesh.position.z < -50) {
                this.container.remove(b.mesh);
                this.bullets.splice(i, 1);
            }
        }

        this.breathe()
        this.slidePose()
        this.sprintPose()
        if (this.blast)
            this.blast.update()
    }
}