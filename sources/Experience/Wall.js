import * as THREE from 'three';
import Experience from './Experience.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Wall {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        
        // FIX: Map the missing resources object from your main Experience instance
        this.resources = this.experience.resources
        
        this.physicsWorld = this.experience.world.physics.world
        this.walls = []
        this.path = null
        
        this.init()
    }

    init() {
        // Safe guard check to avoid console crashes if this class runs out of sequence
        if (!this.resources || !this.resources.items) {
            console.warn('[Wall] Resource repository has not finished downloading yet.')
            return
        }

        const colorTexture = this.resources.items['groundColor']
        const aoTexture = this.resources.items['groundAO']
        const displacementTexture = this.resources.items['groundDisplacement']
        const normalTexture = this.resources.items['groundNormal']
        const roughnessTexture = this.resources.items['groundRoughness']
        const wallGltf = this.resources.items['wallModel']

        if (!wallGltf || !colorTexture || !aoTexture || !displacementTexture || !normalTexture || !roughnessTexture) {
            console.error('[Wall] Required models or texture nodes missing from central cache.')
            return
        }

        this.meshInstance = wallGltf.scene.clone()
        this.meshInstance.scale.set(5.25, 10, 5.25)
        this.meshInstance.updateMatrixWorld(true)

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

        console.log('[Wall] Parsing cached model geometries...')
        this.meshInstance.traverse((node) => {
            if (node.isMesh && node.name.includes("Cube")) {
                node.material = new THREE.MeshStandardMaterial({
                    map: colorTexture,
                    normalMap: normalTexture,
                    roughnessMap: roughnessTexture,
                    displacementMap: displacementTexture,
                    displacementScale: 0.1,
                    roughness: 0.5,
                    metalness: 0.5,
                    side: THREE.DoubleSide
                })
                node.castShadow = true
                node.receiveShadow = true
                this.setPhysics(node)
                this.walls.push(node)
            }
            if (node.name && node.name.includes("Path")) {
                console.log('[Wall] Found path node:', node.name, 'type:', node.type)
                this.path = node
                node.visible = false
            }
            if (node.name && node.name.includes("Pole")) {
                node.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color("gray"),
                    roughness: 0.8,
                    metalness: 0.2
                })
            }
            if (node.name && node.name.includes("Plane")) {
                node.material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color("gray"),
                    roughness: 0.8,
                    metalness: 0.75,
                    side: THREE.DoubleSide
                })
                node.castShadow = true
                node.receiveShadow = true
            }
        })

        console.log('[Wall] Path set to:', this.path?.name, 'geometry:', !!this.path?.geometry)
        this.scene.add(this.meshInstance)
    }

    setPhysics(mesh) {
        if (!this.physicsWorld) {
            console.warn('[Wall] Rapier physics world context not accessible yet.')
            return
        }

        const bbox = new THREE.Box3().setFromObject(mesh)

        const size = new THREE.Vector3()
        bbox.getSize(size)

        const center = new THREE.Vector3()
        bbox.getCenter(center)

        let bodyDesc = RAPIER.RigidBodyDesc.fixed()
            .setTranslation(center.x, center.y, center.z)

        let body = this.physicsWorld.createRigidBody(bodyDesc)

        let colliderDesc = RAPIER.ColliderDesc.cuboid(
            size.x / 2,
            size.y / 2,
            size.z / 2
        )

        this.physicsWorld.createCollider(colliderDesc, body)
    }
}