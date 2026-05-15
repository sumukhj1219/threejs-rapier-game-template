import * as THREE from 'three'
import Experience from "./Experience.js"
import Blast from './Blast.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';

export default class Drone {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        
        this.collisonDistance = 1.0
        this.hasBeenHit = false
        this.droneSpeed = 0.75
        this.progress = 0
        this.pathMesh = null
        this.curve = null
        
        this.animationTimer = 0 

        this.bullets = this.experience.world?.weapon?.bullets || []
        
        this.init()
    }

    init() {
        const gltfLoader = new GLTFLoader()
        gltfLoader.load("/model/drone.glb", (gltf) => {
            // 1. Create a container 
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
                ease: "power2.inOut"
            })
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

    die(impactPoint) {
        this.hasBeenHit = true
        if (typeof Blast === 'function') this.blast = new Blast(impactPoint)
        this.scene.remove(this.droneGroup)
    }

    update() {
        if (!this.hasBeenHit) {
            this.checkForPath()
            this.movements()
            this.checkCollison()
            this.animate()
        }
    }
}