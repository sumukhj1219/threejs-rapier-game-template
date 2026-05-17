import * as THREE from 'three'
import Experience from './Experience.js'
import Player from './Player.js'
import Environment from './Environment.js'
import Physics from './Physics.js'
import Ground from './Ground.js'
import View from './View.js'
import Weapon from './Weapon.js'
import Wall from './Wall.js'
import Blast from './Blast.js'
import Drone from './Drone.js'

export default class World {
    constructor(_options) {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        this.init()
    }

    async init() {
        this.physics = new Physics()
        await this.physics.init()

        this.environment = new Environment()

        this.ground = new Ground()
        this.player = new Player()
        this.view = new View()
        this.weapon = new Weapon()
        this.wall = new Wall()
        this.drone = new Drone()


        this.resources.on('groupEnd', (_group) => {
            if (_group.name === 'base') {
                this.setBaseGrid()
            }
        })
    }

    setBaseGrid() {
        const grid = new THREE.GridHelper(100, 100, new THREE.Color("#444"), new THREE.Color("#222"))   
        grid.material.opacity = 0.5
        grid.material.transparent = true
        this.scene.add(grid)
    }

    resize() {
    }

    update() {
        if (this.physics) this.physics.update()
        if (this.view) this.view.update()
        if (this.player) this.player.update()
        if (this.blast) this.blast.update()
        if (this.energy) this.energy.update()
        if (this.drone) this.drone.update()
    }

    destroy() {
    }
}