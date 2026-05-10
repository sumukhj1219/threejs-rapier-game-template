import * as THREE from 'three'
import Experience from './Experience.js'
import Player from './Player.js'
import Environment from './Environment.js'
import Physics from './Physics.js'
import Ground from './Ground.js'
import View from './View.js'
import Weapon from './Weapon.js'

export default class World {
    constructor(_options) {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        this.resources.on('groupEnd', (_group) => {
            if (_group.name === 'base') {
                this.setBaseGrid()
            }
        })

        this.init()
    }

    setBaseGrid() {
        const size = 100;
        const divisions = 100;
        const gridHelper = new THREE.GridHelper(size, divisions, "#0c0c0c", "#0a0a0a");
        this.scene.add(gridHelper);
    }

    async init() {
        this.physics = new Physics()
        await this.physics.init() 

        this.environment = new Environment()

        this.ground = new Ground()
        this.player = new Player()
        this.view = new View()
        this.weapon = new Weapon()

        this.resources.on('groupEnd', (_group) => {
            if (_group.name === 'base') {
                this.setBaseGrid()
            }
        })
    }

    resize() {
    }

    update() {
        if (this.physics) this.physics.update()
        if (this.view) this.view.update()
        if (this.player) this.player.update()
    }

    destroy() {
    }
}