import Experience from "./Experience";
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat";

export default class Ground {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        
        this.resources = this.experience.resources

        this.physicsWorld = this.experience.world.physics.world

        this.init()
        this.setPhysics()
    }

    init() {
        if (!this.resources || !this.resources.items) {
            console.warn('[Ground] Waiting for resource repository initialization...')
            return
        }

        const colorTexture = this.resources.items['groundColor']
        const aoTexture = this.resources.items['groundAO']
        const displacementTexture = this.resources.items['groundDisplacement']
        const normalTexture = this.resources.items['groundNormal']
        const roughnessTexture = this.resources.items['groundRoughness']

        if (!colorTexture || !aoTexture || !displacementTexture || !normalTexture || !roughnessTexture) {
            console.error('Ground PBR textures missing from resource cache array.')
            return
        }

        const textures = [colorTexture, aoTexture, displacementTexture, normalTexture, roughnessTexture]
        textures.forEach((texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(10, 10)
        })

        const maxAnisotropy = this.experience.renderer.instance.capabilities.getMaxAnisotropy() || 1

        textures.forEach(t => {
            t.generateMipmaps = true
            t.minFilter = THREE.LinearMipmapLinearFilter
            t.magFilter = THREE.LinearFilter
            t.anisotropy = maxAnisotropy
            t.needsUpdate = true 
        })

        colorTexture.encoding = THREE.sRGBEncoding
        aoTexture.encoding = THREE.LinearEncoding
        displacementTexture.encoding = THREE.LinearEncoding
        normalTexture.encoding = THREE.LinearEncoding
        roughnessTexture.encoding = THREE.LinearEncoding

        const groundGeo = new THREE.PlaneGeometry(100, 100, 128, 128)
        groundGeo.setAttribute('uv2', groundGeo.attributes.uv)

        const groundMat = new THREE.MeshStandardMaterial({
            map: colorTexture,
            normalMap: normalTexture,
            roughnessMap: roughnessTexture,
            aoMap: aoTexture,
            aoMapIntensity: 1,
            displacementMap: displacementTexture,
            displacementScale: 0.1,
            side: THREE.DoubleSide,
        })

        this.meshInstance = new THREE.Mesh(groundGeo, groundMat)
        this.meshInstance.rotation.x = -Math.PI * 0.5
        this.meshInstance.receiveShadow = true
        this.scene.add(this.meshInstance)
    }

    setPhysics() {
        if (!this.physicsWorld) {
            console.warn('[Ground] Physics engine world context not ready yet.')
            return
        }
        let bodyDesc = RAPIER.RigidBodyDesc.fixed()
        let body = this.physicsWorld.createRigidBody(bodyDesc)

        let colliderDesc = RAPIER.ColliderDesc.cuboid(50, 0.1, 50)
        this.physicsWorld.createCollider(colliderDesc, body)
    }
}