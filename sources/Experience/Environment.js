import Experience from "./Experience";
import * as THREE from "three"
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export default class Environment {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.lights()
        this.hdriDaySky()
    }

    lights() {
        const dirLight = new THREE.DirectionalLight(new THREE.Color("white"), 1)
        dirLight.position.set(10, 10, 10)
        this.scene.add(dirLight)
    }

    hdriDaySky() {
        const loader = new EXRLoader();
        loader.load('/hdri/Day-Sky.exr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        })
    }
}