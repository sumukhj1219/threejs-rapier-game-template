import Experience from "./Experience";
import * as THREE from 'three'
import RAPIER from "@dimforge/rapier3d-compat";
import Weapon from "./Weapon";
import gsap from "gsap";
import { DEATH_QUOTES } from "./Utils/DeathQuotes";

export default class Player {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physicsWorld = this.experience.world.physics.world

        this.isDead = false
        this.health = 100

        this.init()
        this.setupAudio()
        this.setPhysics()
        this.controls()

        this.sliding = false
        this.slideTime = 0
        this.slideDuration = 0.65
        this.slideCooldown = 0
        this.slideCooldownDuration = 0.8
        this.slideSpeedMultiplier = 1.8
        this.cameraOffsetY = 0.8
        this.moveSpeed = 6
        this.sprintSpeed = 9.5
        this.acceleration = 14
        this.deceleration = 18
        this.isSprinting = false
        this.stamina = 100
        this.maxStamina = 100
        this.staminaDrainRate = 0       
        this.staminaRecoveryRate = 15
        this.slideDirection = new THREE.Vector3()
        this.targetVelocity = new THREE.Vector3()

        this.weapon = new Weapon()
    }

    init() {
        const playerGeo = new THREE.CapsuleGeometry(1, 1)
        const playerMat = new THREE.MeshStandardMaterial({
            color: "#2a2a2b",
            metalness: 0.5,
            roughness: 0.5
        })
        this.meshInstance = new THREE.Mesh(playerGeo, playerMat)
        this.scene.add(this.meshInstance)
    }

    setupAudio() {
        this.camera = this.experience.camera?.instance || this.experience.camera;
        if (!this.camera) return;

        this.audioListener = this.camera.children.find(child => child instanceof THREE.AudioListener);
        if (!this.audioListener) {
            this.audioListener = new THREE.AudioListener();
            this.camera.add(this.audioListener);
        }

        this.resources = this.experience.resources;
        if (!this.resources || !this.resources.items) return;

        this.deathSound = new THREE.Audio(this.audioListener);
        const deadBuffer = this.resources.items['deadSFX'];
        if (deadBuffer) {
            this.deathSound.setBuffer(deadBuffer);
            this.deathSound.setVolume(0.8); 
        }

        this.breatheSound = new THREE.Audio(this.audioListener);
        const breatheBuffer = this.resources.items['breatheSFX'];
        if (breatheBuffer) {
            this.breatheSound.setBuffer(breatheBuffer);
            this.breatheSound.setLoop(true);
            this.breatheSound.setVolume(0.0); 
        }
    }

    setPhysics() {
        const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0, 1, 0)
            .lockRotations()
            .setCanSleep(false);

        this.rigidBody = this.physicsWorld.createRigidBody(rigidBodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 1);
        this.collider = this.physicsWorld.createCollider(colliderDesc, this.rigidBody);
    }

    controls() {
        this.keys = { w: false, a: false, d: false, s: false, j: false, shift: false, ctrl: false }
        this.canJump = true

        window.addEventListener("keydown", (ev) => {
            if (this.isDead) return 
            const key = ev.key.toLowerCase();
            if (key === 'shift') {
                this.keys.shift = true;
                this.tryStartSlide();
                return;
            }

            if (key === 'control') {
                this.keys.ctrl = true;
                return;
            }

            if (this.keys.hasOwnProperty(key)) {
                if (key === 'j' && !this.keys.j && this.canJump) {
                    this.jump();
                }
                this.keys[key] = true;
            }
        });

        window.addEventListener('keydown', (ev) => {
            if (this.isDead && ev.key.toLowerCase() === 'f') {
                window.location.reload();
            }
        });

        window.addEventListener("keyup", (ev) => {
            const key = ev.key.toLowerCase();
            if (key === 'shift') {
                this.keys.shift = false;
                return;
            }

            if (key === 'control') {
                this.keys.ctrl = false;
                return;
            }

            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });
    }

    movements() {
        if (!this.rigidBody) return

        const linVel = this.rigidBody.linvel()
        this.velocity = { x: 0, y: linVel.y, z: 0 }
        const delta = this.experience.time.delta * 0.001

        const isMoving = this.keys.w || this.keys.a || this.keys.s || this.keys.d
        this.isSprinting = this.keys.ctrl && isMoving

        if (this.isSprinting) {
            this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * delta)
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecoveryRate * delta)
        }

        if (this.breatheSound && this.breatheSound.buffer) {
            if (this.isSprinting) {
                if (!this.breatheSound.isPlaying) {
                    this.breatheSound.play();
                }
                this.breatheSound.setVolume(0.85);
            } else {
                if (this.breatheSound.isPlaying) {
                    const currentVol = this.breatheSound.getVolume();
                    if (currentVol > 0.01) {
                        this.breatheSound.setVolume(currentVol * 0.9); 
                    } else {
                        this.breatheSound.stop();
                    }
                }
            }
        }

        const speed = this.isSprinting ? this.sprintSpeed : this.moveSpeed
        const camera = this.experience.camera.instance

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        forward.y = 0
        if (forward.lengthSq() === 0) forward.set(0, 0, -1)
        forward.normalize()

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
        right.y = 0
        if (right.lengthSq() === 0) right.set(1, 0, 0)
        right.normalize()

        this.targetVelocity.set(0, 0, 0)
        if (this.keys.w) this.targetVelocity.add(forward)
        if (this.keys.s) this.targetVelocity.sub(forward)
        if (this.keys.d) this.targetVelocity.add(right)
        if (this.keys.a) this.targetVelocity.sub(right)

        if (this.targetVelocity.lengthSq() > 0) {
            this.targetVelocity.normalize().multiplyScalar(speed)
        }

        const currentHorizontal = new THREE.Vector3(linVel.x, 0, linVel.z)
        const accel = this.targetVelocity.lengthSq() > 0 ? this.acceleration : this.deceleration
        currentHorizontal.lerp(this.targetVelocity, Math.min(1, accel * delta))

        this.velocity.x = currentHorizontal.x
        this.velocity.z = currentHorizontal.z

        if (this.sliding) {
            const slideSpeed = speed * this.slideSpeedMultiplier
            this.velocity.x = this.slideDirection.x * slideSpeed
            this.velocity.z = this.slideDirection.z * slideSpeed
        }

        this.updateSlide(this.experience.time.delta * 0.001)
        this.rigidBody.setLinvel(this.velocity, true);

        const position = this.rigidBody.translation();
        this.meshInstance.position.copy(position);

        const staminaBarElement = document.getElementById('hud-stamina-bar');
        if (staminaBarElement) {
            staminaBarElement.style.transform = `scaleX(${this.stamina / this.maxStamina})`;
        }
    }

    tryStartSlide() {
        if (this.sliding || this.slideCooldown > 0) return
        if (!(this.keys.w || this.keys.a || this.keys.s || this.keys.d)) return

        const camera = this.experience.camera.instance
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
        forward.y = 0
        forward.normalize()

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
        right.y = 0
        right.normalize()

        this.slideDirection.set(0, 0, 0)
        if (this.keys.w) this.slideDirection.add(forward)
        if (this.keys.s) this.slideDirection.sub(forward)
        if (this.keys.d) this.slideDirection.add(right)
        if (this.keys.a) this.slideDirection.sub(right)

        if (this.slideDirection.lengthSq() === 0) {
            this.slideDirection.copy(forward)
        }

        this.slideDirection.normalize()

        this.sliding = true
        this.slideTime = 0
    }

    updateSlide(delta) {
        if (this.slideCooldown > 0) {
            this.slideCooldown = Math.max(0, this.slideCooldown - delta)
        }

        if (!this.sliding) {
            return
        }

        this.slideTime += delta
        const progress = Math.min(this.slideTime / this.slideDuration, 1)
        if (progress >= 1) {
            this.sliding = false
            this.slideCooldown = this.slideCooldownDuration
        }
    }

    jump() {
        if (!this.rigidBody) return

        this.rigidBody.applyImpulse({ x: 0, y: 30.0, z: 0 }, true);

        this.canJump = false;

        setTimeout(() => {
            this.canJump = true;
        }, 1500);
    }

    takeDamage(amount = 25) {
        if (this.isDead) return

        this.health = Math.max(0, this.health - amount);

        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100vw';
        flash.style.height = '100vh';
        flash.style.backgroundColor = 'rgba(180, 0, 0, 0.6)';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '9999';
        flash.style.boxShadow = 'inset 0 0 100px rgba(0,0,0,0.8)';
        document.body.appendChild(flash);

        gsap.to(flash, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => flash.remove()
        });

        const cameraInstance = this.experience.camera?.instance
        if (cameraInstance) {
            gsap.killTweensOf(cameraInstance.rotation);

            const startX = cameraInstance.rotation.x;
            const startY = cameraInstance.rotation.y;
            const startZ = cameraInstance.rotation.z;

            const shakeTl = gsap.timeline();

            shakeTl.to(cameraInstance.rotation, {
                x: startX - 0.08,
                y: startY + (Math.random() - 0.5) * 0.05,
                z: startZ + 0.06,
                duration: 0.03,
                ease: "power4.out"
            })
                .to(cameraInstance.rotation, {
                    x: startX + 0.05,
                    y: startY + (Math.random() - 0.5) * 0.04,
                    z: startZ - 0.04,
                    duration: 0.04,
                    ease: "rough({ template: power2.inOut, strength: 2, points: 3, taper: none, randomize: true, clamp: false })"
                })
                .to(cameraInstance.rotation, {
                    x: startX - 0.02,
                    z: startZ + 0.02,
                    duration: 0.05,
                    ease: "power1.inOut"
                })
                .to(cameraInstance.rotation, {
                    x: startX + 0.01,
                    z: startZ - 0.01,
                    duration: 0.06,
                    ease: "power1.inOut"
                })
                .to(cameraInstance.rotation, {
                    x: startX,
                    y: startY,
                    z: startZ,
                    duration: 0.12,
                    ease: "power2.out"
                });
        }

        if (this.health <= 0) {
            this.die();
        }

        const healthBarElement = document.getElementById('hud-health-bar');
        if (healthBarElement) {
            healthBarElement.style.transform = `scaleX(${this.health / 100})`;
        }
    }

    die() {
        const healthBarElement = document.getElementById('hud-health-bar');
        if (healthBarElement) healthBarElement.style.transform = 'scaleX(0)';

        const hudContainer = document.querySelector('.hud-container');
        if (hudContainer) hudContainer.style.display = 'none';

        this.isDead = true;
        this.scene.remove(this.meshInstance);

        if (this.rigidBody && this.physicsWorld) {
            this.physicsWorld.removeRigidBody(this.rigidBody);
            this.rigidBody = null;
        }

        if (this.breatheSound && this.breatheSound.isPlaying) {
            this.breatheSound.stop();
        }

        if (this.deathSound && this.deathSound.buffer) {
            this.deathSound.play();
        }

        console.log("Player died!");

        const blurOverlay = document.querySelector('.screen-blur-overlay');
        const deathTextElement = document.querySelector('.screen-blur-overlay .death-text');
        const crosshair = document.querySelector('.cod-crosshair');

        const randomIndex = Math.floor(Math.random() * DEATH_QUOTES.length);
        const selectedQuote = DEATH_QUOTES[randomIndex];

        if (deathTextElement) {
            deathTextElement.innerText = selectedQuote;
        }

        if (blurOverlay) {
            blurOverlay.classList.add('player-dead');
        }

        if (crosshair) {
            crosshair.classList.add('hidden');
        }
    }

    update() {
        if (this.isDead) return

        if (this.rigidBody) {
            const position = this.rigidBody.translation();
            const rotation = this.rigidBody.rotation();

            this.meshInstance.position.copy(position);
            this.meshInstance.quaternion.copy(rotation);
        }

        if (this.weapon && !this.isDead)
            this.movements()
        this.weapon.update()
    }
}