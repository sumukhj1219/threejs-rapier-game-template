import Experience from "./Experience";
import * as THREE from "three"

import portalVertexShader from "../Shaders/portal/portal-vertex.glsl"
import portalFragmentShader from "../Shaders/portal/portal-frag.glsl"

export default class Portal {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        this.init()
        this.setupAudio() 
    }

    init() {
        if (!this.resources.items) return

        const portalTexture = this.resources.items['fractalNoise']

        const planeGeometry = new THREE.PlaneGeometry(1, 1, 132, 132)
        const planeMaterial = new THREE.ShaderMaterial({
            vertexShader: portalVertexShader,
            fragmentShader: portalFragmentShader,
            uniforms:{
                uTime:{value: 2.0},
                uTexture:{value: portalTexture},
            },
            side: THREE.DoubleSide,
            transparent: true,
        })
        this.portalMesh = new THREE.Mesh(planeGeometry, planeMaterial)
        this.portalMesh.position.set(0, 50, 46.90)
        this.portalMesh.scale.setScalar(40)
        this.scene.add(this.portalMesh)
    }


    setupAudio() {
        this.camera = this.experience.camera?.instance || this.experience.camera;
        if (!this.camera || !this.resources || !this.resources.items) return;

       
        this.audioListener = this.camera.children.find(child => child instanceof THREE.AudioListener);
        if (!this.audioListener) {
            this.audioListener = new THREE.AudioListener();
            this.camera.add(this.audioListener);
        }

        this.portalSound = new THREE.PositionalAudio(this.audioListener);
        
        const audioBuffer = this.resources.items['portalSFX'];
        if (audioBuffer && this.portalMesh) {
            this.portalSound.setBuffer(audioBuffer);
            this.portalSound.setRefDistance(15); 
            this.portalSound.setMaxDistance(120); 
            this.portalSound.setLoop(true);
            this.portalSound.setVolume(0.4);

            this.portalMesh.add(this.portalSound);
            this.portalSound.play();
        }
    }

    update() {
        if(this.portalMesh) {
            this.portalMesh.material.uniforms.uTime.value += 0.01
        }
    }
}