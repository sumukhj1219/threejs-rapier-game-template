import Experience from "./Experience";
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

export default class Ground {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        
        this.physicsWorld = this.experience.world.physics.world

        this.init()
        this.setPhysics()
    }

    init() {
        const groundGeo = new THREE.PlaneGeometry(100, 100)
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: '#111111',
            metalness: 0.3,
            roughness: 0.8 
        })
        
        this.meshInstance = new THREE.Mesh(groundGeo, groundMat)
        
        this.meshInstance.rotation.x = -Math.PI * 0.5
        this.scene.add(this.meshInstance)
    }

    setPhysics() {
        let bodyDesc = RAPIER.RigidBodyDesc.fixed()
        let body = this.physicsWorld.createRigidBody(bodyDesc)

        let colliderDesc = RAPIER.ColliderDesc.cuboid(50, 0.1, 50)
        this.physicsWorld.createCollider(colliderDesc, body)
    }
}