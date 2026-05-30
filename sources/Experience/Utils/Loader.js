import * as THREE from 'three'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

export default class Resources extends EventEmitter
{
    /**
     * Constructor
     */
    constructor()
    {
        super()

        this.experience = new Experience()
        this.renderer = this.experience.renderer.instance

        this.setLoaders()

        this.toLoad = 0
        this.loaded = 0
        this.items = {}
    }

    /**
     * Set loaders
     */
    setLoaders()
    {
        this.loaders = []

        // Textures (Updated to use TextureLoader so wrapS/wrapT works out of the box!)
        const textureLoader = new THREE.TextureLoader()
        this.loaders.push({
            extensions: ['jpg', 'jpeg', 'png'],
            action: (_resource) =>
            {
                textureLoader.load(_resource.source, (_texture) =>
                {
                    this.fileLoadEnd(_resource, _texture)
                },
                undefined,
                () => {
                    this.fileLoadEnd(_resource, null)
                })
            }
        })

        // Draco
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('draco/')
        dracoLoader.setDecoderConfig({ type: 'js' })

        this.loaders.push({
            extensions: ['drc'],
            action: (_resource) =>
            {
                dracoLoader.load(_resource.source, (_data) =>
                {
                    this.fileLoadEnd(_resource, _data)
                    DRACOLoader.releaseDecoderModule()
                })
            }
        })

        // GLTF
        const gltfLoader = new GLTFLoader()
        gltfLoader.setDRACOLoader(dracoLoader)

        this.loaders.push({
            extensions: ['glb', 'gltf'],
            action: (_resource) =>
            {
                gltfLoader.load(_resource.source, (_data) =>
                {
                    this.fileLoadEnd(_resource, _data)
                })
            }
        })

        // FBX
        const fbxLoader = new FBXLoader()

        this.loaders.push({
            extensions: ['fbx'],
            action: (_resource) =>
            {
                fbxLoader.load(_resource.source, (_data) =>
                {
                    this.fileLoadEnd(_resource, _data)
                })
            }
        })

        // RGBE | HDR
        const rgbeLoader = new RGBELoader()

        this.loaders.push({
            extensions: ['hdr'],
            action: (_resource) =>
            {
                rgbeLoader.load(_resource.source, (_data) =>
                {
                    this.fileLoadEnd(_resource, _data)
                })
            }
        })

        // FIX: Audio Loader Integration
        const audioLoader = new THREE.AudioLoader()
        this.loaders.push({
            extensions: ['mp3', 'wav', 'ogg'],
            action: (_resource) =>
            {
                audioLoader.load(_resource.source, (_audioBuffer) =>
                {
                    this.fileLoadEnd(_resource, _audioBuffer)
                },
                undefined,
                (error) => {
                    console.error(`[Resources] Failed to stream audio file: ${_resource.source}`, error)
                    this.fileLoadEnd(_resource, null)
                })
            }
        })
    }

    /**
     * Load
     */
    load(_resources = [])
    {
        for(const _resource of _resources)
        {
            this.toLoad++
            
            // Safe guard path verification
            if (!_resource.source || typeof _resource.source !== 'string') {
                console.warn(`[Resources] Invalid source definition for asset entry: ${_resource.name}`)
                this.fileLoadEnd(_resource, null)
                continue
            }

            // FIX: Updated regular expression to look for alphanumeric extensions (captures the '3' in mp3)
            const extensionMatch = _resource.source.match(/\.([a-z0-9]+)$/i)

            if(extensionMatch && extensionMatch[1])
            {
                const extension = extensionMatch[1].toLowerCase()
                const loader = this.loaders.find((_loader) => _loader.extensions.find((_extension) => _extension === extension))

                if(loader)
                {
                    loader.action(_resource)
                }
                else
                {
                    console.warn(`Cannot find loader for ${_resource.source}`)
                    this.fileLoadEnd(_resource, null)
                }
            }
            else
            {
                console.warn(`Cannot determine extension of ${_resource.source}`)
                this.fileLoadEnd(_resource, null)
            }
        }
    }

    /**
     * File load end
     */
    fileLoadEnd(_resource, _data)
    {
        this.loaded++
        this.items[_resource.name] = _data

        this.trigger('fileEnd', [_resource, _data])

        if(this.loaded === this.toLoad)
        {
            this.trigger('end')
        }
    }
}