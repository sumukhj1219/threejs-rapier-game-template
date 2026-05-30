import * as THREE from 'three'
import Experience from './Experience.js'
import Player from './Player.js'
import Environment from './Environment.js'
import Physics from './Physics.js'
import Ground from './Ground.js'
import View from './View.js'
import Weapon from './Weapon.js'
import Wall from './Wall.js'
import Drone from "./Drone.js"
import Explosion from './Explosion.js'
import Portal from "./Portal.js"

export default class World {
    constructor(_options) {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        this.loadingScreen = document.getElementById('loading-screen')
        this.loadingBar = document.getElementById('loading-bar')
        this.loadingStatusText = document.querySelector('.loading-status')

        this.worldBuilt = false

        this.init()
    }

    async init() {
        this.physics = new Physics()
        await this.physics.init()

        if (this.resources) {
            this.resources.on('progress', (currentGroup, resource) => {
                if (currentGroup && currentGroup.toLoad > 0) {
                    const percentage = (currentGroup.loaded / currentGroup.toLoad) * 100

                    if (this.loadingBar) {
                        this.loadingBar.style.width = `${percentage}%`
                    }

                    if (this.loadingStatusText && resource) {
                        this.loadingStatusText.innerText = `DECOMPRESSING MODULE: ${resource.name.toUpperCase()}...`
                    }
                }
            })

            this.resources.on('end', () => {
                console.log('[World] Resources loaded fully. Assembling world graphs...')
                this.buildGameWorld()
                
                setTimeout(() => {
                    this.endLoadingScreen()
                }, 400)
            })

            this.resources.on('groupEnd', (_group) => {
                if (_group && _group.name === 'base') {
                    this.setBaseGrid() 
                }
            })
        }
        
        if (this.resources && this.resources.items && this.resources.items['gunModel']) {
            console.log('[World] Fallback triggered: Cache verified on startup.')
            this.buildGameWorld()
            if (this.loadingScreen) {
                setTimeout(() => this.endLoadingScreen(), 300)
            }
        }
    }

    buildGameWorld() {
        if (this.worldBuilt) return 
        if (!this.resources || !this.resources.items) return
        
        this.environment = new Environment()
        
        this.ground = new Ground()   
        this.wall = new Wall()       
        this.weapon = new Weapon()   
        
        this.player = new Player()
        this.view = new View()
        this.portal = new Portal()
        this.drone = new Drone()

        this.worldBuilt = true
    }

    setBaseGrid() {
        console.log('[World] Base asset sync phase resolved.')
    }

    endLoadingScreen() {
        if (this.loadingScreen) {
            if (this.loadingBar) this.loadingBar.style.width = '100%'
            if (this.loadingStatusText) this.loadingStatusText.innerText = "SYSTEM ACTIVE. LINK SECURED."

            this.loadingScreen.classList.add('loaded')

            setTimeout(() => {
                if (this.loadingScreen) this.loadingScreen.remove()
            }, 800)
        }
    }

    resize() {}

    update() {
        if (this.physics) this.physics.update()
        
        if (!this.worldBuilt) return

        if (this.view && this.player && !this.player.isDead) this.view.update()
        if (this.player) this.player.update()
        if (this.portal) this.portal.update()
        if (this.drone) this.drone.update()
    }

    destroy() {}
}