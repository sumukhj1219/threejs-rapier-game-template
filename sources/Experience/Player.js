import Experience from "./Experience";
import * as THREE from 'three'
import RAPIER from "@dimforge/rapier3d-compat";
import Weapon from "./Weapon";

export default class Player {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physicsWorld = this.experience.world.physics.world

        this.init()
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
        this.staminaDrainRate = 20
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
        this.isSprinting = this.keys.ctrl && isMoving && this.stamina > 0

        if (this.isSprinting) {
            this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * delta)
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRecoveryRate * delta)
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

    update() {
        if (this.rigidBody) {
            const position = this.rigidBody.translation();
            const rotation = this.rigidBody.rotation();

            this.meshInstance.position.copy(position);
            this.meshInstance.quaternion.copy(rotation);
        }

        this.movements()
        if (this.weapon)
            this.weapon.update()
    }
}