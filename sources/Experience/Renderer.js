import * as THREE from 'three'
import Experience from './Experience.js'

export default class Renderer
{
    constructor(_options = {})
    {
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.stats = this.experience.stats
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.camera = this.experience.camera

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('renderer')
        }

        this.setInstance()
    }

    setInstance()
    {
        this.clearColor = '#010101'

        this.instance = new THREE.WebGLRenderer({
            alpha: false,
            antialias: true
        })
        this.instance.domElement.style.position = 'absolute'
        this.instance.domElement.style.top = 0
        this.instance.domElement.style.left = 0
        this.instance.domElement.style.width = '100%'
        this.instance.domElement.style.height = '100%'
        
        this.instance.setClearColor(this.clearColor, 1)
        this.instance.setSize(this.config.width, this.config.height)
        this.instance.setPixelRatio(this.config.pixelRatio)

        this.instance.physicallyCorrectLights = true
        this.instance.outputEncoding = THREE.sRGBEncoding
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        this.instance.toneMapping = THREE.NoToneMapping
        this.instance.toneMappingExposure = 1

        this.context = this.instance.getContext()

        // Add stats panel
        if(this.stats)
        {
            this.stats.setRenderPanel(this.context)
        }
        
        // Debug
        if(this.debug)
        {
            this.debugFolder
                .addColor(
                    this,
                    'clearColor'
                )
                .onChange(() =>
                {
                    this.instance.setClearColor(this.clearColor)
                })

            this.debugFolder
                .add(
                    this.instance,
                    'toneMapping',
                    {
                        'NoToneMapping': THREE.NoToneMapping,
                        'LinearToneMapping': THREE.LinearToneMapping,
                        'ReinhardToneMapping': THREE.ReinhardToneMapping,
                        'CineonToneMapping': THREE.CineonToneMapping,
                        'ACESFilmicToneMapping': THREE.ACESFilmicToneMapping
                    }
                )
                .onChange(() =>
                {
                    this.scene.traverse((_child) =>
                    {
                        if(_child instanceof THREE.Mesh)
                            _child.material.needsUpdate = true
                    })
                })
                
            this.debugFolder
                .add(
                    this.instance,
                    'toneMappingExposure'
                )
                .min(0)
                .max(10)
        }
    }

    resize()
    {
        this.instance.setSize(this.config.width, this.config.height)
        this.instance.setPixelRatio(this.config.pixelRatio)
    }

    update()
    {
        if(this.stats)
        {
            this.stats.beforeRender()
        }

        // Standard direct renderer invocation
        this.instance.render(this.scene, this.camera.instance)

        if(this.stats)
        {
            this.stats.afterRender()
        }
    }

    destroy()
    {
        this.instance.renderLists.dispose()
        this.instance.dispose()
    }
}