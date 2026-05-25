import * as THREE from 'three'
import gsap from 'gsap'

export default class MuzzleFlash {
    constructor(scene, position) {
        this.scene = scene
        this.group = new THREE.Group()
        this.group.position.copy(position)
        this.scene.add(this.group)

        this.init()
    }

    init() {
        const flashGeom = new THREE.SphereGeometry(0.3, 16, 16)
        const flashMat = new THREE.MeshBasicMaterial({
            color: '#ffaa00',
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        })
        const flashMesh = new THREE.Mesh(flashGeom, flashMat)
        this.group.add(flashMesh)

        const flashLight = new THREE.PointLight('#ffaa00', 5, 5)
        this.group.add(flashLight)

        // 3. Animate the burst out out existence rapidly
        gsap.to(flashMesh.scale, {
            x: 2, y: 2, z: 2,
            duration: 0.1,
            ease: "power2.out"
        })

        gsap.to([flashMat, flashLight], {
            opacity: 0,
            intensity: 0,
            duration: 0.12,
            ease: "power1.in",
            onComplete: () => {
                this.destroy()
            }
        })
    }

    destroy() {
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose()
            if (child.material) child.material.dispose()
        })
        this.scene.remove(this.group)
    }
}