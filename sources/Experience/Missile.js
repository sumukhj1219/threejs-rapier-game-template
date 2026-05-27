// Missile.js
import * as THREE from 'three'

export default class Missile {
    constructor(scene, spawnPosition, player, onHitCallback) {
        this.scene = scene
        this.player = player
        this.onHitCallback = onHitCallback
        
        this.speed = 1 
        this.turnSpeed = 1.5 
        this.alive = true
        this.lifeTime = 0
        this.maxLifeTime = 300 

        this.init(spawnPosition)
    }

    init(spawnPosition) {
        this.mesh = new THREE.Group()
        this.mesh.position.copy(spawnPosition)

        const bodyGeom = new THREE.CylinderGeometry(0.05, 0.05, 1, 16)
        bodyGeom.rotateX(Math.PI / 2) 
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: "#444444", 
            metalness: 0.8, 
            roughness: 0.3 
        })
        const body = new THREE.Mesh(bodyGeom, bodyMat)
        this.mesh.add(body)

        const tipGeom = new THREE.ConeGeometry(0.05, 0.3, 16)
        tipGeom.rotateX(Math.PI / 2)
        tipGeom.translate(0, 0, 0.55) 
        const tipMat = new THREE.MeshBasicMaterial({ color: "#3c3735" })
        const tip = new THREE.Mesh(tipGeom, tipMat)
        this.mesh.add(tip)

        const trailGeom = new THREE.CylinderGeometry(0.08, 0.01, 0.4, 8)
        trailGeom.rotateX(Math.PI / 2)
        trailGeom.translate(0, 0, -0.5) 
        const trailMat = new THREE.MeshBasicMaterial({
            color: "#9b9892",
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        })
        const trail = new THREE.Mesh(trailGeom, trailMat)
        this.mesh.add(trail)

        this.scene.add(this.mesh)
        
        const targetPos = this.player.meshInstance.position.clone().add(new THREE.Vector3(0, 1, 0))
        this.mesh.lookAt(targetPos)
        this.velocity = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).multiplyScalar(this.speed)
    }

    update() {
        if (!this.alive || !this.player?.meshInstance) return

        this.lifeTime++
        if (this.lifeTime > this.maxLifeTime) {
            this.destroy()
            return
        }

        const targetPos = this.player.meshInstance.position.clone().add(new THREE.Vector3(0, 1, 0))

        const currentRotation = this.mesh.quaternion.clone()
        this.mesh.lookAt(targetPos)
        const targetRotation = this.mesh.quaternion.clone()
        
        currentRotation.slerp(targetRotation, this.turnSpeed)
        this.mesh.quaternion.copy(currentRotation)

        this.velocity.set(0, 0, this.speed).applyQuaternion(this.mesh.quaternion)
        this.mesh.position.add(this.velocity)

        const dist = this.mesh.position.distanceTo(targetPos)
        if (dist < 1.3) {
            this.onHitCallback(this.mesh.position)
            this.destroy()
        }
    }

    destroy() {
        this.alive = false
        this.mesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) child.material.dispose()
        })
        this.scene.remove(this.mesh)
    }
}