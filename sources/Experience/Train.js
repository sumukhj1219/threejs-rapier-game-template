import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Experience from './Experience';

export default class Train {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.physicsWorld = this.experience.world.physics.world;
        this.init();
    }

    init() {
        const loader = new GLTFLoader();
        loader.load('/model/train.glb', (gltf) => {
            console.log("Full GLTF object:", gltf);

            this.model = gltf.scene;
            this.model.scale.set(2, 1, 1);
            this.scene.add(this.model);

            const ambient = new THREE.AmbientLight(0xffffff, 1.5);
            this.scene.add(ambient);

            this.setPhysicsAndLights();
        });
    }

    setPhysicsAndLights() {
        this.model.traverse((node) => {

            if (node.isMesh) {
                const name = node.name;
                node.position.y += 0.01

                if (name.toLowerCase().includes("cylinder")) {
                    node.material = new THREE.MeshBasicMaterial({ color: "#ffffff" });
                    console.log("SUCCESS: Found and colored Cylinder");
                }
                else if (name === "Car") {
                    node.material = new THREE.MeshStandardMaterial({
                        color: new THREE.Color("#ff00ff"),
                        side: THREE.DoubleSide
                    });
                }
                else {
                    node.material = new THREE.MeshStandardMaterial({
                        color: new THREE.Color("#ffffff"),
                        side: THREE.DoubleSide
                    });
                }

                if (name.toLowerCase().includes("lightcase")) {
                    this.createInteriorLight(node);
                }
            }
        });
    }

    createInteriorLight(mesh) {
        mesh.material = new THREE.MeshBasicMaterial({ color: "#ffffff" });

        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);

        const light = new THREE.PointLight(0xffffff, 150, 20);
        light.position.set(worldPos.x, worldPos.y - 0.7, worldPos.z);
        this.scene.add(light);
    }

    createHollowShell(mesh) {
    // 1. Force Three.js to calculate the final world position/scale
    mesh.updateWorldMatrix(true, true);
    
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();
    
    mesh.getWorldPosition(worldPos);
    mesh.getWorldQuaternion(worldQuat);
    mesh.getWorldScale(worldScale);

    // 2. Create the body at the exact world coordinates
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
        .setTranslation(worldPos.x, worldPos.y, worldPos.z)
        .setRotation(worldQuat);
    
    const body = this.physicsWorld.createRigidBody(bodyDesc);

    // 3. Extract geometry
    const vertices = mesh.geometry.attributes.position.array;
    const indices = mesh.geometry.index.array;
    
    // 4. Create the Trimesh and FORCE the scale to match worldScale
    const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
    colliderDesc.setScale(worldScale.x, worldScale.y, worldScale.z);
    
    this.physicsWorld.createCollider(colliderDesc, body);
    
    console.log(`Car Physics: Scaled to ${worldScale.x}, ${worldScale.y}, ${worldScale.z}`);
}

createPropPhysics(mesh) {
    mesh.updateWorldMatrix(true, true);
    
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    const worldScale = new THREE.Vector3();

    mesh.getWorldPosition(worldPos);
    mesh.getWorldQuaternion(worldQuat);
    mesh.getWorldScale(worldScale);

    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
        .setTranslation(worldPos.x, worldPos.y, worldPos.z)
        .setRotation(worldQuat);
        
    const body = this.physicsWorld.createRigidBody(bodyDesc);

    const vertices = mesh.geometry.attributes.position.array;
    
    // Use convexHull for props - it's more reliable for collisions than trimesh
    const colliderDesc = RAPIER.ColliderDesc.convexHull(vertices);
    
    if (colliderDesc) {
        colliderDesc.setScale(worldScale.x, worldScale.y, worldScale.z);
        this.physicsWorld.createCollider(colliderDesc, body);
    }
}
}