import Experience from "./Experience";
import * as THREE from "three"

export default class Environment {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.lights()
    }

    lights() {
        const dirLight = new THREE.DirectionalLight(new THREE.Color("white"), 1)
        dirLight.position.set(10, 10, 10)
        this.scene.add(dirLight)
    }
}