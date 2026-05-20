import * as THREE from 'three'
import Experience from './Experience'

export default class Explosion {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        // Sphere resolution for the explosion shape layout
        this.radius = 2
        this.widthSegments = 16
        this.heightSegments = 16

        // A reusable matrix object to handle position, rotation, and scale for each instance
        this.dummyMatrix = new THREE.Object3D()

        this.init()
    }

    init() {
        // 1. Get positions for the layout shape
        const sampleGeometry = new THREE.SphereGeometry(this.radius, this.widthSegments, this.heightSegments)
        const spherePositions = sampleGeometry.attributes.position.array
        this.totalParticles = spherePositions.length / 3

        // Keep track of positions and velocities in memory
        this.particleData = []

        // 2. Define the geometry of an INDIVIDUAL particle (a tiny sphere)
        // Keep the segments low (e.g., 4x4 or 8x8) so performance stays lightning fast
        const particleGeometry = new THREE.SphereGeometry(0.1, 5, 5)
        
        const material = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            roughness: 0.4,
            metalness: 0.1,
            transparent: true,
            opacity: 1
        })

        // 3. Create the InstancedMesh
        this.mesh = new THREE.InstancedMesh(particleGeometry, material, this.totalParticles)
        this.scene.add(this.mesh)

        for (let i = 0; i < this.totalParticles; i++) {
            const index = i * 3

            const x = spherePositions[index]
            const y = spherePositions[index + 1]
            const z = spherePositions[index + 2]

            // Outward vector direction
            const direction = new THREE.Vector3(x, y, z).normalize()
            const speed = 0.5 + Math.random() * 0.5

            // Store current position and moving velocity for the update loop
            this.particleData.push({
                position: new THREE.Vector3(x, y, z),
                velocity: direction.multiplyScalar(speed),
                scale: 1
            })

            // Set the initial position transform matrix into the InstancedMesh
            this.dummyMatrix.position.set(x, y, z)
            this.dummyMatrix.updateMatrix()
            this.mesh.setMatrixAt(i, this.dummyMatrix.matrix)
        }

        // Notify the mesh to update its initial positions
        this.mesh.instanceMatrix.needsUpdate = true

        sampleGeometry.dispose()
    }

    update() {
        if (this.mesh) {
            for (let i = 0; i < this.totalParticles; i++) {
                const data = this.particleData[i]

                // Move position based on velocity
                data.position.addScaledVector(data.velocity, 0.1)

                // Apply drag/friction to velocity
                data.velocity.multiplyScalar(0.95)

                // Update the transformation matrix for this specific particle instance
                this.dummyMatrix.position.copy(data.position)
                
                // Shrink the tiny spheres as they fly outward
                data.scale *= 0.98
                this.dummyMatrix.scale.set(data.scale, data.scale, data.scale)
                
                this.dummyMatrix.updateMatrix()
                this.mesh.setMatrixAt(i, this.dummyMatrix.matrix)
            }

            // Tell Three.js the matrices changed this frame
            this.mesh.instanceMatrix.needsUpdate = true

            // Fade out the material
            if (this.mesh.material.opacity > 0) {
                this.mesh.material.opacity -= 0.005
            } else {
                this.destroy()
            }
        }
    }

    destroy() {
        this.scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        this.mesh.material.dispose()
        this.mesh = null
    }
}