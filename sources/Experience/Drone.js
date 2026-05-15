import * as THREE from 'three'
import Experience from "./Experience.js"
import Blast from './Blast.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Drone {
    constructor(_options) {
        console.log('[Drone] Constructor called')
        this.experience = new Experience()
        this.scene = this.experience.scene
        
        this.collisonDistance = 1.0
        this.hasBeenHit = false
        this.droneSpeed = 0.75
        this.progress = 0
        this.pathMesh = null
        this.curve = null

        this.bullets = this.experience.world?.weapon?.bullets || []
        
        if (this.experience.world?.wall?.path) {
            this.pathMesh = this.experience.world.wall.path
            this.setupPath()
        }

        this.init()
    }

    checkForPath() {
        if (this.curve) return
        const wall = this.experience.world?.wall
        if (!wall || !wall.path) return

        console.log('[Drone] Path found! Setting up curve')
        this.pathMesh = wall.path
        this.setupPath()
    }

    init() {
        const gltfLoader = new GLTFLoader()
        gltfLoader.load("/model/drone.glb", (gltf) => {
            this.droneModel = gltf.scene
            this.droneModel.traverse((node) => {        
                if (node.isMesh) {
                    node.material.color.set(new THREE.Color("#2a2a2b"))
                    node.material.roughness = 0.5
                    node.material.metalness = 1
                    node.castShadow = true
                    node.receiveShadow = true
                    node.rotateY = Math.PI
                }
            })
            this.droneModel.position.set(0, 5, 0)
            this.droneModel.scale.set(0.5, 0.5, 0.5)
            this.scene.add(this.droneModel)
        })
    }

    setupPath() {
        if (!this.pathMesh || !this.pathMesh.geometry) {
            console.log('[Drone] No pathMesh or geometry, returning')
            return
        }

        const positions = this.pathMesh.geometry.attributes.position.array
        const points = []

        console.log('[Drone] Path has', positions.length / 3, 'vertices')
        this.pathMesh.updateMatrixWorld()
        
        for (let i = 0; i < positions.length; i += 3) {
            const v = new THREE.Vector3(
                positions[i], 
                positions[i + 1], 
                positions[i + 2]
            )
            v.applyMatrix4(this.pathMesh.matrixWorld)
            points.push(v)
        }

        this.curve = new THREE.CatmullRomCurve3(points, true)
        this.curve.curveType = 'centripetal'
    }

    movements() {
        if (!this.curve) {
            if (!this.loggedNoCurve) {
                this.loggedNoCurve = true
            }
            return
        }
        if (this.hasBeenHit || !this.droneModel) return

        this.progress += 0.0005 * this.droneSpeed 
        if (this.progress > 1) this.progress = 0

        const currentPos = this.curve.getPointAt(this.progress)
        this.droneModel.position.copy(currentPos)

        const lookAtTarget = this.curve.getPointAt((this.progress + 0.01) % 1)
        this.droneModel.lookAt(lookAtTarget)

        const time = Date.now() * 0.002
        
        this.droneModel.position.y += Math.sin(time) * 0.05
        
        const tangent = this.curve.getTangentAt(this.progress)
        this.droneModel.rotation.z = -tangent.x * 0.8 
    }

    checkCollison() {
        if (this.hasBeenHit || !this.droneModel) return

        const bulletPos = new THREE.Vector3()

        this.bullets.forEach((bullet) => {
            const bMesh = bullet?.mesh ?? bullet
            if (!bMesh || typeof bMesh.getWorldPosition !== 'function') return

            bMesh.getWorldPosition(bulletPos)
            
            const dist = bulletPos.distanceTo(this.droneModel.position)
            
            if (dist < this.collisonDistance) {
                this.die(bulletPos)
            }
        })
    }

    die(impactPoint) {
        this.hasBeenHit = true
        
        if (typeof Blast === 'function') {
            this.blast = new Blast(impactPoint)
        }
        
        this.scene.remove(this.droneModel)
        
        this.droneModel.traverse((node) => {
            if (node.geometry) {
                node.geometry.dispose()
            }
            if (node.material) {
                if (Array.isArray(node.material)) {
                    node.material.forEach(mat => mat.dispose())
                } else {
                    node.material.dispose()
                }
            }
        })
        
    }

    update() {
        if (!this.hasBeenHit) {
            this.checkForPath()
            this.movements()
            this.checkCollison()
        }
    }
}