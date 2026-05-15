import * as THREE from 'three'
import Experience from "./Experience.js"
import Blast from './Blast.js'

export default class Drone {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.collisonDistance = 1
        this.hasBeenHit = false
        this.droneSpeed = 0.1

        if (this.experience.world.weapon)
            this.bullets = this.experience.world.weapon.bullets
        else
            this.bullets = []

        if (this.experience.world.wall.walls) {
            this.walls = this.experience.world.wall.walls
        } else {
            this.walls = []
        }

        this.init()
    }

    init() {
        const geometry = new THREE.CapsuleGeometry(0.15, 0.15, 32)
        geometry.rotateX(Math.PI / 2)
        const material = new THREE.MeshStandardMaterial({ color: '#2a2a2a' })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(0, 5, 0)
        this.droneModel = mesh
        this.scene.add(mesh)
    }

    movements() {
        const wallToDroneDistance = this.walls.map(wall => wall.position.distanceTo(this.droneModel.position))


        if (wallToDroneDistance.some(distance => distance < this.collisonDistance * 2)) {
            const closestWallIndex = wallToDroneDistance.indexOf(Math.min(...wallToDroneDistance))
            const closestWall = this.walls[closestWallIndex]
            const directionAwayFromWall = new THREE.Vector3().subVectors(this.droneModel.position, closestWall.position).normalize()
            this.droneModel.position.add(directionAwayFromWall.multiplyScalar(0.02))
        } else {
            const randomDirection = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize()
            this.droneModel.position.add(randomDirection.multiplyScalar(0.01))
        }
    }

    checkCollison() {
        const worldPos = new THREE.Vector3()

        this.bullets.forEach((bullet) => {
            const target = bullet?.mesh ?? bullet
            if (!target || typeof target.getWorldPosition !== 'function') return

            target.getWorldPosition(worldPos)
            const distance = worldPos.distanceTo(this.droneModel.position)
            if (distance < this.collisonDistance && !this.hasBeenHit) {
                this.hasBeenHit = true
                this.blast = new Blast(worldPos)
                this.scene.remove(this.droneModel)
            }
        })
    }

    update() {
        if (this.droneModel) {
            this.checkCollison()
            this.movements()
        }
    }
}