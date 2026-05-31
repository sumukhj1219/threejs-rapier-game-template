import * as THREE from 'three'
import Experience from "./Experience.js"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import Explosion from './Explosion.js';
import RAPIER from '@dimforge/rapier3d-compat';
import MuzzleFlash from './MuzzleFlash.js';
import Missile from './Missile.js';
import Item from './Item.js'; // Imported Item script reference link

export default class Drone {
    constructor(_options = {}) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.physics = this.experience.world?.physics

        this.pathIndex = _options.pathIndex || 0

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

        this.debrisSourcePieces = []
        this.activeDebris = []

        this.resources = this.experience.resources

        // Reference target allocation array managed by the world scope instance
        this.activeItems = this.experience.world?.activeItems || []

        this.init()
        this.setupAudio()
    }

    init() {
        if (!this.resources || !this.resources.items) {
            console.warn('[Drone] Waiting for resource repository initialization...')
            return
        }

        const gltf = this.resources.items['droneModel']
        if (!gltf) {
            console.error('[Drone] Drone model asset missing from cache dictionary.')
            return
        }

        this.droneGroup = new THREE.Group()
        this.droneModel = gltf.scene.clone()

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
            if (node.name && node.name.includes("Blaster")) {
                this.blaster = node
            }
        })

        this.droneGroup.add(this.droneModel)
        this.droneGroup.position.set(0, 5, 0)
        this.droneGroup.scale.set(0.5, 0.5, 0.5)

        this.scene.add(this.droneGroup)
        console.log(`[Drone] Drone assigned to path index ${this.pathIndex} deployed.`);
    }

    setupAudio() {
        this.camera = this.experience.camera?.instance || this.experience.camera
        if (!this.camera || !this.resources.items) return

        this.audioListener = this.camera.children.find(child => child instanceof THREE.AudioListener)
        if (!this.audioListener) {
            this.audioListener = new THREE.AudioListener()
            this.camera.add(this.audioListener)
        }

        this.explosionSound = new THREE.PositionalAudio(this.audioListener)
        const audioBuffer = this.resources.items['blastSFX'] || this.resources.items['shootSFX']
        if (audioBuffer) {
            this.explosionSound.setBuffer(audioBuffer)
            this.explosionSound.setRefDistance(10)
            this.explosionSound.setMaxDistance(100)
            this.explosionSound.setVolume(5.0)
        }

        this.flyingSound = new THREE.PositionalAudio(this.audioListener)
        const humBuffer = this.resources.items['droneSFX']
        if (humBuffer && this.droneGroup) {
            this.flyingSound.setBuffer(humBuffer)
            this.flyingSound.setRefDistance(3)
            this.flyingSound.setMaxDistance(45)
            this.flyingSound.setLoop(true)
            this.flyingSound.setVolume(5)

            this.droneGroup.add(this.flyingSound)
            this.flyingSound.play()
        }
    }

    checkForPath() {
        if (this.curve) return
        const wall = this.experience.world?.wall

        if (!wall || !wall.paths || !wall.paths[this.pathIndex]) return

        this.pathMesh = wall.paths[this.pathIndex]
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

        const curveLength = this.curve.getLength()

        const distancePerFrame = 0.75 * this.droneSpeed
        this.progress += distancePerFrame / curveLength

        if (this.progress > 1) this.progress = 0

        const currentPos = this.curve.getPointAt(this.progress)
        this.droneGroup.position.copy(currentPos)

        const lookAtTarget = this.curve.getPointAt((this.progress + 0.01) % 1)
        if (lookAtTarget) {
            this.droneGroup.lookAt(lookAtTarget)
        }

        const time = Date.now() * 0.002
        this.droneGroup.position.y += Math.sin(time) * 0.05

        const tangent = this.curve.getTangentAt(this.progress)
        if (tangent) {
            this.droneGroup.rotation.z = -tangent.x * 0.8
        }
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

        const tent = this.experience.world?.tent
        if (tent && tent.position) {
            const playerWorldPos = new THREE.Vector3()
            player.meshInstance.getWorldPosition(playerWorldPos)

            const dx = playerWorldPos.x - tent.position.x
            const dz = playerWorldPos.z - tent.position.z
            const distanceToTentCenter = Math.sqrt(dx * dx + dz * dz)

            if (distanceToTentCenter < 5.5) {
                this.shootCooldown = 200
                return
            }
        }

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

    applyBlastForceField(originPoint) {
        if (!this.activeDebris.length) return

        const blastPower = 45.0
        const debrisPos = new THREE.Vector3()

        this.activeDebris.forEach((debris) => {
            const bodyTranslation = debris.body.translation()
            debrisPos.set(bodyTranslation.x, bodyTranslation.y, bodyTranslation.z)

            const forceDirection = new THREE.Vector3().subVectors(debrisPos, originPoint)
            const distance = Math.max(0.2, forceDirection.length())
            forceDirection.normalize()

            const pushMagnitude = blastPower / (distance * distance)
            forceDirection.multiplyScalar(pushMagnitude)

            debris.body.applyImpulse({
                x: forceDirection.x,
                y: forceDirection.y + 5.0,
                z: forceDirection.z
            }, true)
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

        for (let i = this.droneBullets.length - 1; i >= 0; i--) {
            const missile = this.droneBullets[i]
            if (missile && missile.mesh) {
                if (typeof Explosion === 'function') {
                    const missilePos = new THREE.Vector3()
                    missile.mesh.getWorldPosition(missilePos)
                    new Explosion(missilePos)
                }
                this.scene.remove(missile.mesh)
                if (missile.destroy) {
                    missile.destroy()
                }
            }
        }
        this.droneBullets = []

        if (this.flyingSound && this.flyingSound.isPlaying) {
            this.flyingSound.stop()
        }

        if (this.explosionSound) {
            const dummySoundObject = new THREE.Object3D()
            dummySoundObject.position.copy(impactPoint)
            this.scene.add(dummySoundObject)
            dummySoundObject.add(this.explosionSound)
            this.explosionSound.play()
        }

        if (typeof Explosion === 'function') {
            this.blast = new Explosion(impactPoint)
        } else {
            console.error("Explosion class is not loaded or defined.")
        }

        this.spawnRapierDebris()

        this.applyBlastForceField(impactPoint)

        // Capture death point coordinates before removing the main structural transformations
        const spawnCoords = new THREE.Vector3()
        if (this.droneGroup) {
            this.droneGroup.getWorldPosition(spawnCoords)
        } else {
            spawnCoords.copy(impactPoint)
        }

        // Drop Mechanics probability filter pass (50% Chance to spawn item)
        if (Math.random() < 0.5 && this.physics?.world) {
            console.log("[Loot System] Drop signature confirmed. Spawning matrix container.");
            const droppedLoot = new Item(spawnCoords, this.scene, this.physics.world)
            
            // Push item straight to your central tracked repository collection array
            if (this.activeItems) {
                this.activeItems.push(droppedLoot)
            }
        }

        if (this.droneGroup) {
            this.scene.remove(this.droneGroup)
            for (let i = 0; i < this.bullets.length; i++) {
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
        } else {
            this.updateRapierDebris()
        }
    }
}