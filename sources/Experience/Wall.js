import * as THREE from 'three';
import Experience from './Experience.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Wall {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.physicsWorld = this.experience.world.physics.world

        this.init()
    }

    init() {
        const loader = new THREE.TextureLoader()
        const basePath = '/pbr/tile/'

        const colorTexture = loader.load(`${basePath}Tiles135D_4K-JPG_Color.jpg`)
        const aoTexture = loader.load(`${basePath}Tiles135D_4K-JPG_AmbientOcclusion.jpg`)
        const displacementTexture = loader.load(`${basePath}Tiles135D_4K-JPG_Displacement.jpg`)
        const normalTexture = loader.load(`${basePath}Tiles135D_4K-JPG_NormalGL.jpg`)
        const roughnessTexture = loader.load(`${basePath}Tiles135D_4K-JPG_Roughness.jpg`)

        const textures = [colorTexture, aoTexture, displacementTexture, normalTexture, roughnessTexture]
        textures.forEach((texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
            texture.repeat.set(10, 10)
            texture.needsUpdate = true
        })

        const maxAnisotropy = this.experience.renderer.instance.capabilities.getMaxAnisotropy() || 1;

        [colorTexture, aoTexture, normalTexture, roughnessTexture, displacementTexture].forEach(t => {
            t.generateMipmaps = true;
            t.minFilter = THREE.LinearMipmapLinearFilter;
            t.magFilter = THREE.LinearFilter;
            t.anisotropy = maxAnisotropy;
        });

        colorTexture.encoding = THREE.sRGBEncoding
        aoTexture.encoding = THREE.LinearEncoding
        displacementTexture.encoding = THREE.LinearEncoding
        normalTexture.encoding = THREE.LinearEncoding
        roughnessTexture.encoding = THREE.LinearEncoding

        const gltfLoader = new GLTFLoader()
        gltfLoader.load("/model/wall.glb", (gltf) => {
            this.meshInstance = gltf.scene
            this.meshInstance.traverse((node) => {
                if (node.isMesh) {
                    node.material = new THREE.MeshStandardMaterial({
                        map: colorTexture,
                        normalMap: normalTexture,
                        roughnessMap: roughnessTexture,
                        displacementMap: displacementTexture,
                        displacementScale: 0.1,
                        roughness: 1,
                        metalness: 0,
                        side: THREE.DoubleSide
                    })
                    node.castShadow = true
                    node.receiveShadow = true
                }
            })
            this.meshInstance.scale.set(5.25, 10, 5.25)
            this.scene.add(this.meshInstance)
        })
    }
}