import Experience from "./Experience";
import * as THREE from "three";

export default class View {
    constructor() {
        this.experience = new Experience()
        this.camera = this.experience.camera.instance
        this.world = this.experience.world
        
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ')
        
        this.setMouseListeners()
    }

    setMouseListeners() {
        window.addEventListener('click', () => {
            document.body.requestPointerLock()
        })

        window.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                const sensitivity = 0.002
                
                this.euler.y -= event.movementX * sensitivity 
                this.euler.x -= event.movementY * sensitivity 
                
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x))
            }
        })
    }

    update() {
        if (!this.world.player) return

        const playerMesh = this.world.player.meshInstance

        this.camera.position.copy(playerMesh.position)
        this.camera.position.y += 0.8 

        this.camera.quaternion.setFromEuler(this.euler)

        playerMesh.quaternion.setFromEuler(new THREE.Euler(0, this.euler.y, 0))
    }
}