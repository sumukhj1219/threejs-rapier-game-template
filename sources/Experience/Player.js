import Experience from "./Experience";
import * as THREE from 'three'
import RAPIER from "@dimforge/rapier3d-compat";

export default class Player {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physicsWorld = this.experience.world.physics.world

        this.init()
        this.setPhysics()
        this.controls()
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
        this.keys = { w: false, a: false, d: false, s: false, j: false }
        this.canJump = true

        window.addEventListener("keydown", (ev) => {
            const key = ev.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                if (key === 'j' && !this.keys.j && this.canJump) {
                    this.jump();
                }
                this.keys[key] = true;
            }
        });

        window.addEventListener("keyup", (ev) => {
            const key = ev.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
            }
        });
    }

    movements() {
        if (!this.rigidBody) return

        this.velocity = { x: 0, y: this.rigidBody.linvel().y, z: 0 }
        const speed = 5

        if (this.keys.w) this.velocity.z -= speed;
        if (this.keys.s) this.velocity.z += speed;
        if (this.keys.a) this.velocity.x -= speed;
        if (this.keys.d) this.velocity.x += speed;
        this.jump()

        this.rigidBody.setLinvel(this.velocity, true);

        const position = this.rigidBody.translation();
        this.meshInstance.position.copy(position);
    }

    jump() {
        if (!this.rigidBody) return

        this.rigidBody.applyImpulse({ x: 0, y: 30.0, z: 0 }, true);

        this.canJump = false;

        setTimeout(() => {
            this.canJump = true;
        }, 1500);
    }

    view() {
        const direction = new THREE.Vector3()
        const frontVector = new THREE.Vector3(0, 0, Number(this.keys.s) - Number(this.keys.w))
        const sideVector = new THREE.Vector3(Number(this.keys.a) - Number(this.keys.d), 0, 0)

        direction
            .subVectors(frontVector, sideVector)
            .normalize()
            .applyQuaternion(this.meshInstance.quaternion)
            .multiplyScalar(this.speed)

        this.rigidBody.setLinvel({ x: direction.x, y: this.rigidBody.linvel().y, z: direction.z }, true)
    }

    update() {
        if (this.rigidBody) {
            const position = this.rigidBody.translation();
            const rotation = this.rigidBody.rotation();

            this.meshInstance.position.copy(position);
            this.meshInstance.quaternion.copy(rotation);
        }

        this.view()
        this.movements()
    }
}