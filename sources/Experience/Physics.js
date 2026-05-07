import RAPIER from "@dimforge/rapier3d-compat";
import Experience from "./Experience";
export default class Physics {
    constructor() {
        this.experience = new Experience()
    }

    async init() {
        await RAPIER.init()
        const gravity = { x: 0.0, y: -9.81, z: 0.0 }
        this.world = new RAPIER.World(gravity)
        
        return this.world 
    }

    update() {
        if (this.world) {
            this.world.step()
        }
    }
}