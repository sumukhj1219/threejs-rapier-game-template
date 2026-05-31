import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export default class Item {
    constructor(position, scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld
        this.isSettled = false;
        this.spawnTime = 0;
        this.useArcadeFallback = false;

        this.geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        this.material = new THREE.MeshStandardMaterial({ 
            color: 0x00ffcc, 
            emissive: 0x00aa88,
            roughness: 0.2
        });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);

        try {
            const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
                .setTranslation(position.x, position.y, position.z)
                .setLinearDamping(0.5)
                .setAngularDamping(0.5);
                
            this.body = this.physicsWorld.createRigidBody(bodyDesc);

            const colliderDesc = RAPIER.ColliderDesc.cuboid(0.2, 0.2, 0.2)
                .setRestitution(0.6)
                .setFriction(0.5);
                
            this.collider = this.physicsWorld.createCollider(colliderDesc, this.body);

            const angle = Math.random() * Math.PI * 2;
            const horizontalForce = 1.5 + Math.random() * 2.0;
            const upwardForce = 3.5 + Math.random() * 2.5;

            this.body.applyImpulse({ 
                x: Math.cos(angle) * horizontalForce, 
                y: upwardForce, 
                z: Math.sin(angle) * horizontalForce 
            }, true);

        } catch (error) {
            console.warn("[Loot System] Rapier initialization sync mismatch. Activating arcade physics fallback loop.", error.message);
            this.useArcadeFallback = true;
            
            const angle = Math.random() * Math.PI * 2;
            const horizontalSpeed = 2.0 + Math.random() * 2.0;
            this.velocity = new THREE.Vector3(
                Math.cos(angle) * horizontalSpeed,
                6.0 + Math.random() * 4.0,
                Math.sin(angle) * horizontalSpeed
            );
            this.mesh.position.copy(position);
        }
    }

    update(totalTime) {
        if (!this.mesh) return;

        if (this.isSettled) {
            this.mesh.rotation.y += 0.02;
            this.mesh.position.y = this.settledY + Math.sin((totalTime - this.spawnTime) * 3) * 0.08;
            return;
        }

        if (!this.useArcadeFallback && this.body) {
            const translation = this.body.translation();
            const rotation = this.body.rotation();

            this.mesh.position.set(translation.x, translation.y, translation.z);
            this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

            const linvel = this.body.linvel();
            const speed = Math.sqrt(linvel.x * linvel.x + linvel.y * linvel.y + linvel.z * linvel.z);
            
            if (speed < 0.15 && translation.y < 0.6) {
                this.isSettled = true;
                this.settledY = translation.y + 0.1;
                this.spawnTime = totalTime;
                
                if (this.physicsWorld) {
                    this.physicsWorld.removeRigidBody(this.body);
                }
                this.body = null;
                this.mesh.rotation.set(0, 0, 0);
            }
        } else {
            if (!this.velocity) return;
            
            this.velocity.y -= 0.25; 
            this.mesh.position.x += this.velocity.x * 0.016;
            this.mesh.position.y += this.velocity.y * 0.016;
            this.mesh.position.z += this.velocity.z * 0.016;
            
            this.mesh.rotation.x += 0.05;
            this.mesh.rotation.y += 0.02;

            if (this.mesh.position.y <= 0.2) {
                this.mesh.position.y = 0.2;
                this.velocity.y = -this.velocity.y * 0.45; 
                this.velocity.x *= 0.6;
                this.velocity.z *= 0.6;

                if (Math.abs(this.velocity.y) < 0.8) {
                    this.isSettled = true;
                    this.settledY = 0.2;
                    this.spawnTime = totalTime;
                    this.mesh.rotation.set(0, 0, 0);
                }
            }
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
        
        if (!this.useArcadeFallback && this.body && this.physicsWorld) {
            try {
                this.physicsWorld.removeRigidBody(this.body);
            } catch (e) {}
        }
    }
}