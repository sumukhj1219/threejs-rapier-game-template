import Experience from "./Experience";
import * as THREE from "three"
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

export default class Environment {
    constructor(_options) {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.lights()
        // this.hdriDaySky()
        // this.fog()
    }

    lights() {
        const dirLight = new THREE.DirectionalLight(new THREE.Color("white"), 5)
        dirLight.position.set(100, 300, 100)
        dirLight.castShadow = true

        dirLight.shadow.mapSize.set(4096, 4096)
        dirLight.shadow.bias = -0.001 

        dirLight.shadow.camera.near = 1
        dirLight.shadow.camera.far = 1000

        dirLight.shadow.camera.left = -100
        dirLight.shadow.camera.right = 100
        dirLight.shadow.camera.top = 100
        dirLight.shadow.camera.bottom = -100

        this.scene.add(dirLight)

        const hemiLight = new THREE.HemisphereLight(
            0x87CEEB,
            0x444444,
            0.8
        );
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);
    }

    hdriDaySky() {
        const loader = new EXRLoader();
        loader.load('/hdri/Day-Sky.exr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
            this.scene.environmentIntensity = 0.5
        })
    }

    fog() {
        this.scene.fog = new THREE.FogExp2(new THREE.Color("#2a2a2b"), 0.01)
    }

}