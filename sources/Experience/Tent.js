import Experience from "./Experience"
import * as THREE from "three"
import RAPIER from "@dimforge/rapier3d-compat"

export default class Tent {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.resources = this.experience.resources
        this.physicsWorld = this.experience.world.physics.world

        this.position = new THREE.Vector3(40, -0.4, 30)

        this.init()
    }

    init() {
        if (!this.resources || !this.resources.items) {
            console.warn('[Tent] Waiting for asset inventory initialization context...')
            return
        }

        const colorTexture = this.resources.items['tentColor']
        const aoTexture = this.resources.items['tentAO']
        const displacementTexture = this.resources.items['tentDisplacement']
        const normalTexture = this.resources.items['tentNormal']
        const roughnessTexture = this.resources.items['tentRoughness']

        if (!colorTexture || !aoTexture || !displacementTexture || !normalTexture || !roughnessTexture) {
            console.error('Tent PBR textures missing from resource cache array.')
            return
        }

        const textures = [colorTexture, aoTexture, displacementTexture, normalTexture, roughnessTexture]
        textures.forEach((texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(5, 5)
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

        const gltf = this.resources.items['tentModel']
        if (!gltf) {
            console.error('[Tent] Tent model asset missing from cache dictionary.')
            return
        }

        this.tent = gltf.scene.clone()
        this.tent.rotation.y = (-Math.PI/2)
        this.tent.scale.set(1, 1, 1)
        this.tent.position.copy(this.position)

        this.tent.traverse((node) => {
            if (node.isMesh && node.material && node.name.includes("Cylinder")) {
                node.material = new THREE.MeshStandardMaterial({ color: new THREE.Color("#2a2a2a"), roughness: 1, metalness: 0 })
            }
            if (node.isMesh && node.material && node.name.includes("Cone")) {
                node.material = new THREE.MeshStandardMaterial({
                    map: colorTexture,
                    normalMap: normalTexture,
                    roughnessMap: roughnessTexture,
                    aoMap: aoTexture,
                    aoMapIntensity: 1,
                    displacementMap: displacementTexture,
                    displacementScale: 0.1,
                    side: THREE.DoubleSide,
                })
                node.material.roughness = 1
                node.material.metalness = 0
            }
            if (node.isMesh) {
                node.castShadow = true
                node.receiveShadow = true
            }
        })

        this.scene.add(this.tent)

        this.buildManualHollowPhysics()
        
        console.log('[Tent] Outpost tent deployed with precise manual door clearances.')
    }

    buildManualHollowPhysics() {
        if (!this.physicsWorld) return

        const tentHeight = 6.0; 
        const tentRadius = 4.5;  
        const wallThickness = 0.4;
        const posY = this.position.y + (tentHeight / 2)

        this.createStaticBox(
            this.position.x - tentRadius, 
            posY,
            this.position.z,
            wallThickness, 
            tentHeight, 
            tentRadius * 2
        )

        this.createStaticBox(
            this.position.x,
            posY,
            this.position.z - tentRadius,
            tentRadius * 2,
            tentHeight,
            wallThickness
        )
        this.createStaticBox(
            this.position.x,
            posY,
            this.position.z + tentRadius,
            tentRadius * 2,
            tentHeight,
            wallThickness
        )

    }

    createStaticBox(x, y, z, sizeX, sizeY, sizeZ) {
        let bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z)
        let body = this.physicsWorld.createRigidBody(bodyDesc)
        let colliderDesc = RAPIER.ColliderDesc.cuboid(sizeX / 2, sizeY / 2, sizeZ / 2)
        this.physicsWorld.createCollider(colliderDesc, body)
    }
}