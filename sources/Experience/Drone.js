import * as THREE from 'three'
import Experience from "./Experience.js"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import Explosion from './Explosion.js';
import RAPIER from '@dimforge/rapier3d-compat';
import MuzzleFlash from './MuzzleFlash.js';
import Missile from './Missile.js';

export default class Drone {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.physics = this.experience.world?.physics

        this.collisonDistance = 1.0
        this.hasBeenHit = false
        this.droneSpeed = 0.75
        this.progress = 0
        this.pathMesh = null
        this.curve = null

        this.animationTimer = 0

        this.bullets = this.experience.world?.weapon?.bullets || []

        this.droneBullets = []
        this.shootCooldown = 0
        this.shootCooldownMax = 1.5
        this.shootDistance = 50
        this.blasterPosition = new THREE.Vector3()

        this.shotsFired = 0
        this.maxShots = 3

        // Debris collections
        this.debrisSourcePieces = []
        this.activeDebris = []

        this.init()
    }

    init() {
        const gltfLoader = new GLTFLoader()
        gltfLoader.load("/model/drone.glb", (gltf) => {
            this.droneGroup = new THREE.Group()
            this.droneModel = gltf.scene

            this.droneModel.rotation.y = Math.PI

            this.droneModel.traverse((node) => {
                if (node.isMesh) {
                    node.material.color.set(new THREE.Color("#2a2a2b"))
                    node.material.roughness = 0.5
                    node.material.metalness = 1
                    node.castShadow = true
                    node.receiveShadow = true

                    if (node.name.toLowerCase().includes("body_cell")) {
                        node.visible = false
                        node.castShadow = true
                        node.receiveShadow = true
                        this.debrisSourcePieces.push(node)
                    }
                }
                if (node.name.includes("Blaster")) {
                    this.blaster = node
                }
            })

            this.droneGroup.add(this.droneModel)
            this.droneGroup.position.set(0, 5, 0)
            this.droneGroup.scale.set(0.5, 0.5, 0.5)

            this.scene.add(this.droneGroup)
        })
    }

    checkForPath() {
        if (this.curve) return
        const wall = this.experience.world?.wall
        if (!wall || !wall.path) return

        this.pathMesh = wall.path
        this.setupPath()
    }

    setupPath() {
        if (!this.pathMesh || !this.pathMesh.geometry) return

        const positions = this.pathMesh.geometry.attributes.position.array
        const points = []

        this.pathMesh.updateMatrixWorld()

        for (let i = 0; i < positions.length; i += 3) {
            const v = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2])
            v.applyMatrix4(this.pathMesh.matrixWorld)
            points.push(v)
        }

        this.curve = new THREE.CatmullRomCurve3(points, false)
    }

    movements() {
        if (!this.curve || this.hasBeenHit || !this.droneGroup) return

        this.progress += 0.0005 * this.droneSpeed
        if (this.progress > 1) this.progress = 0

        const currentPos = this.curve.getPointAt(this.progress)
        this.droneGroup.position.copy(currentPos)

        const lookAtTarget = this.curve.getPointAt((this.progress + 0.01) % 1)
        this.droneGroup.lookAt(lookAtTarget)

        const time = Date.now() * 0.002
        this.droneGroup.position.y += Math.sin(time) * 0.05

        const tangent = this.curve.getTangentAt(this.progress)
        this.droneGroup.rotation.z = -tangent.x * 0.8
    }

    animate() {
        if (!this.droneGroup || this.hasBeenHit) return

        this.animationTimer += 16

        if (this.animationTimer >= 5000) {
            this.animationTimer = 0

            gsap.to(this.droneModel.rotation, {
                z: this.droneModel.rotation.z + Math.PI * 2,
                duration: 0.75,
                ease: "power2.inOut",
            })
        }
    }

    aimAtPlayer() {
        if (!this.blaster || !this.droneGroup) return

        const player = this.experience.world?.player
        if (!player || !player.meshInstance) return

        const playerPos = player.meshInstance.position
        const blasterWorldPos = new THREE.Vector3()
        this.blaster.getWorldPosition(blasterWorldPos)

        const directionToPlayer = new THREE.Vector3()
        directionToPlayer.subVectors(playerPos, blasterWorldPos)
        directionToPlayer.normalize()

        const yawAngle = Math.atan2(directionToPlayer.x, directionToPlayer.z)

        this.blaster.rotation.y = yawAngle
    }

    shootAtPlayer() {
        if (!this.blaster || !this.droneGroup) {
            this.shootCooldown = 0
            return
        }

        const player = this.experience.world?.player
        if (!player || !player.meshInstance) return

        if (this.shotsFired >= this.maxShots) return

        this.shootCooldown -= 16

        const playerPos = player.meshInstance.position.clone()
        const distance = this.droneGroup.position.distanceTo(playerPos)

        if (distance > this.shootDistance || this.shootCooldown > 0) return

        this.shootCooldown = this.shootCooldownMax
        this.shotsFired++

        const blasterWorldPos = new THREE.Vector3()
        this.blaster.getWorldPosition(blasterWorldPos)

        new MuzzleFlash(this.scene, blasterWorldPos)

        const trackingMissile = new Missile(
            this.scene,
            blasterWorldPos,
            player,
            (impactPoint) => {
                if (typeof Explosion === 'function') {
                    new Explosion(impactPoint)
                }

                if (player.takeDamage) {
                    player.takeDamage();
                }

                const weapon = this.experience.world?.weapon;
                if (weapon && weapon.applyBlastImpact) {
                    weapon.applyBlastImpact();
                }

                gsap.delayedCall(0.25, () => {
                    if (player.die) {
                        player.die();
                    }
                });
            }
        )

        this.droneBullets.push(trackingMissile)
    }

    updateDroneBullets() {
        for (let i = this.droneBullets.length - 1; i >= 0; i--) {
            const missile = this.droneBullets[i]
            missile.update()

            if (!missile.alive) {
                this.droneBullets.splice(i, 1)
            }
        }
    }

    checkCollison() {
        if (this.hasBeenHit || !this.droneGroup) return

        const bulletPos = new THREE.Vector3()
        this.bullets.forEach((bullet) => {
            const bMesh = bullet?.mesh ?? bullet
            if (!bMesh) return

            bMesh.getWorldPosition(bulletPos)
            const dist = bulletPos.distanceTo(this.droneGroup.position)

            if (dist < this.collisonDistance) {
                this.die(bulletPos)
            }
        })
    }

    spawnRapierDebris() {
        if (this.debrisSourcePieces.length === 0 || !this.physics || !this.physics.world) return

        const rapier = RAPIER
        const world = this.physics.world

        const worldPos = new THREE.Vector3()
        const worldQuaternion = new THREE.Quaternion()
        const worldScale = new THREE.Vector3()

        this.debrisSourcePieces.forEach((piece) => {
            piece.visible = true

            piece.updateMatrixWorld(true)
            piece.getWorldPosition(worldPos)
            piece.getWorldQuaternion(worldQuaternion)
            piece.getWorldScale(worldScale)

            this.scene.add(piece)
            piece.position.copy(worldPos)
            piece.quaternion.copy(worldQuaternion)
            piece.scale.copy(worldScale)

            const bodyDesc = rapier.RigidBodyDesc.dynamic()
                .setTranslation(worldPos.x, worldPos.y, worldPos.z)
                .setRotation({ x: worldQuaternion.x, y: worldQuaternion.y, z: worldQuaternion.z, w: worldQuaternion.w })
            const body = world.createRigidBody(bodyDesc)

            piece.geometry.computeBoundingBox()
            const bounds = piece.geometry.boundingBox

            const sizeX = Math.max(0.1, (bounds.max.x - bounds.min.x) * worldScale.x)
            const sizeY = Math.max(0.1, (bounds.max.y - bounds.min.y) * worldScale.y)
            const sizeZ = Math.max(0.1, (bounds.max.z - bounds.min.z) * worldScale.z)

            const colliderDesc = rapier.ColliderDesc.cuboid(sizeX * 0.5, sizeY * 0.5, sizeZ * 0.5)
                .setRestitution(0.3)
                .setFriction(0.5)
                .setDensity(1.0)
                .setMass(3)

            world.createCollider(colliderDesc, body)

            const impulse = {
                x: (Math.random() - 0.5) * 10.0,
                y: (Math.random() * 2.0) + 2.0,
                z: (Math.random() - 0.5) * 10.0
            }
            body.applyImpulse(impulse, true)

            const torque = {
                x: (Math.random() - 0.5) * 10.0,
                y: (Math.random() - 0.5) * 0.5,
                z: (Math.random() - 0.5) * 10.0
            }
            body.applyTorqueImpulse(torque, true)

            if (piece.material) {
                piece.material = piece.material.clone()
                piece.material.transparent = true
            }

            this.activeDebris.push({
                mesh: piece,
                body: body,
                life: 10.0
            })
        })
    }

    updateRapierDebris() {
        if (!this.physics || !this.physics.world) return

        const world = this.physics.world

        for (let i = this.activeDebris.length - 1; i >= 0; i--) {
            const debris = this.activeDebris[i]
            const position = debris.body.translation()
            const rotation = debris.body.rotation()

            debris.mesh.position.set(position.x, position.y, position.z)
            debris.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)

            debris.life -= 0.008
            if (debris.mesh.material) {
                debris.mesh.material.opacity = Math.max(0, debris.life)
            }

            if (debris.life <= 0) {
                world.removeRigidBody(debris.body)
                this.scene.remove(debris.mesh)
                this.activeDebris.splice(i, 1)
            }
        }
    }

    die(impactPoint) {
        this.hasBeenHit = true
        console.log("impact point", impactPoint)

        if (typeof Explosion === 'function') {
            this.blast = new Explosion(impactPoint)
        } else {
            console.error("Explosion class is not loaded or defined.")
        }

        this.spawnRapierDebris()

        if (this.droneGroup) {
            this.scene.remove(this.droneGroup)
            for (let i=0; i < this.bullets.length; i++) {
                const bMesh = this.bullets[i]?.mesh ?? this.bullets[i]
                if (bMesh) {
                    this.scene.remove(bMesh)
                }
            }
        }
    }

    update() {
        if (!this.hasBeenHit) {
            this.checkForPath()
            this.movements()
            this.checkCollison()
            this.animate()
            this.aimAtPlayer()
            this.shootAtPlayer()
            this.updateDroneBullets()
            // Removed crashing checkCollisionWithPlayer loop invocation
        } else {
            this.updateRapierDebris()
        }
    }
}