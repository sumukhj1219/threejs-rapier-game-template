import * as THREE from 'three'
import Wavedash from "@wvdsh/sdk-js" // Official Wavedash Platform SDK Singleton
import Experience from './Experience.js'
import Player from './Player.js'
import Environment from './Environment.js'
import Physics from './Physics.js'
import Ground from './Ground.js'
import View from './View.js'
import Weapon from './Weapon.js'
import Wall from './Wall.js'
import Drone from "./Drone.js"
import Explosion from './Explosion.js'
import Portal from "./Portal.js"
import Tent from './Tent.js'

export default class World {
    constructor(_options) {
        this.experience = new Experience()
        this.config = this.experience.config
        this.scene = this.experience.scene
        this.resources = this.experience.resources

        this.loadingScreen = document.getElementById('loading-screen')
        this.loadingBar = document.getElementById('loading-bar')
        this.loadingStatusText = document.querySelector('.loading-status')

        this.drones = []
        this.tent = null

        this.activeItems = []
        this.playerCargoCount = 0
        this.tentStorageVault = 0

        this.worldBuilt = false
        this.scoreSubmitted = false // Track score submission to prevent infinite loops on death

        this.spawnTimer = 0
        this.spawnInterval = 30000
        this.waveMultiplier = 1
        this.totalDronesSpawned = 0
        this.availablePathsCount = 3

        this.totalSurvivalTime = 0

        this.countdownElement = document.getElementById('hud-countdown')
        this.totalTimeElement = document.getElementById('hud-total-time')
        this.chronoContainer = document.querySelector('.chrono-hud')

        this.init()
    }

    async init() {
        this.physics = new Physics()
        await this.physics.init()

        if (this.resources) {
            this.resources.on('progress', (currentGroup, resource) => {
                if (currentGroup && currentGroup.toLoad > 0) {
                    const fraction = currentGroup.loaded / currentGroup.toLoad
                    const percentage = fraction * 100

                    if (this.loadingBar) {
                        this.loadingBar.style.width = `${percentage}%`
                    }

                    Wavedash.updateLoadProgressZeroToOne(fraction)

                    if (this.loadingStatusText && resource) {
                        this.loadingStatusText.innerText = `DECOMPRESSING MODULE: ${resource.name.toUpperCase()}...`
                    }
                }
            })

            this.resources.on('end', () => {
                console.log('[World] Resources loaded fully. Assembling world graphs...')
                this.buildGameWorld()

                Wavedash.updateLoadProgressZeroToOne(1.0)

                setTimeout(() => {
                    this.endLoadingScreen()
                }, 400)
            })

            this.resources.on('groupEnd', (_group) => {
                if (_group && _group.name === 'base') {
                    this.setBaseGrid()
                }
            })
        }

        if (this.resources && this.resources.items && this.resources.items['gunModel']) {
            console.log('[World] Fallback triggered: Cache verified on startup.')
            this.buildGameWorld()
            Wavedash.updateLoadProgressZeroToOne(1.0)
            if (this.loadingScreen) {
                setTimeout(() => this.endLoadingScreen(), 300)
            }
        }
    }

    buildGameWorld() {
        if (this.worldBuilt) return
        if (!this.resources || !this.resources.items) return

        this.environment = new Environment()
        this.ground = new Ground()
        this.wall = new Wall()
        this.weapon = new Weapon()

        this.tent = new Tent()

        this.player = new Player()
        this.view = new View()
        this.portal = new Portal()

        this.availablePathsCount = (this.wall.paths && this.wall.paths.length > 0) ? this.wall.paths.length : 3

        this.clock = new THREE.Clock()

        this.worldBuilt = true
    }

    spawnNextEndlessDrone() {
        const targetPathIndex = this.totalDronesSpawned % this.availablePathsCount

        const droneInstance = new Drone({ pathIndex: targetPathIndex })
        this.drones.push(droneInstance)

        this.totalDronesSpawned++
        console.log(`[ALERT] Drone spawned: Active global pool count = #${this.totalDronesSpawned} on track line ${targetPathIndex + 1}.`);
    }

    setBaseGrid() {
        console.log('[World] Base asset sync phase resolved.')
    }

    endLoadingScreen() {
        if (this.loadingScreen) {
            if (this.loadingBar) this.loadingBar.style.width = '100%'
            if (this.loadingStatusText) this.loadingStatusText.innerText = "SYSTEM ACTIVE. LINK SECURED."

            this.loadingScreen.classList.add('loaded')

            setTimeout(() => {
                if (this.loadingScreen) this.loadingScreen.remove()
            }, 800)
        }
    }

    resize() { }

    update() {
        if (this.physics) this.physics.update()

        if (!this.worldBuilt) return

        const playerDeadState = this.player && this.player.isDead

        // --- NEW LEADERBOARD GAME OVER TRIGGER ---
        if (playerDeadState && !this.scoreSubmitted) {
            this.scoreSubmitted = true; // Guard to execute only once on death

            const totalSeconds = Math.floor(this.totalSurvivalTime / 1000);
            const finalScore = (totalSeconds * 10) + (this.tentStorageVault * 100);

            console.log(`[GAME OVER] Finalizing score protocols. Score: ${finalScore}`);

            // Submit metrics through the Wavedash SDK
            if (typeof Wavedash !== 'undefined' && Wavedash.submitScore) {
                Wavedash.submitScore(finalScore);
            }

            // Unhide the game over leaderboard overlay element
            const lbOverlay = document.getElementById('leaderboard-overlay');
            if (lbOverlay) {
                lbOverlay.classList.remove('hidden');

                // Populate the match summary text fields
                const summaryText = document.getElementById('lb-summary-text');
                if (summaryText) {
                    summaryText.innerText = `SURVIVED: ${totalSeconds}s | CARGO SECURED: ${this.tentStorageVault}`;
                }

                // Inject calculated points into your Rank slot UI
                const playerPointsText = document.getElementById('lb-player-pts');
                if (playerPointsText) {
                    playerPointsText.innerText = `${finalScore.toLocaleString()} PTS`;
                }
            }
        }

        if (this.view && this.player && !playerDeadState) this.view.update()
        if (this.player) this.player.update()
        if (this.portal) this.portal.update()

        if (this.clock && !playerDeadState) {
            const delta = this.clock.getDelta() * 1000

            this.spawnTimer += delta

            if (this.spawnTimer >= this.spawnInterval) {
                console.log(`[WAVE RESET] Spawning ${this.waveMultiplier} drones simultaneously into paths.`);
                for (let i = 0; i < this.waveMultiplier; i++) {
                    this.spawnNextEndlessDrone()
                }
                this.waveMultiplier++
                this.spawnTimer = 0
            }

            this.totalSurvivalTime += delta

            if (this.countdownElement) {
                const secondsRemaining = Math.max(0, Math.ceil((this.spawnInterval - this.spawnTimer) / 1000))
                this.countdownElement.innerText = `${secondsRemaining}s`

                if (this.chronoContainer) {
                    if (secondsRemaining <= 10) {
                        this.chronoContainer.classList.add('critical-alert')
                    } else {
                        this.chronoContainer.classList.remove('critical-alert')
                    }
                }
            }

            if (this.totalTimeElement) {
                const totalSeconds = Math.floor(this.totalSurvivalTime / 1000)
                const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
                const seconds = (totalSeconds % 60).toString().padStart(2, '0')
                this.totalTimeElement.innerText = `${minutes}:${seconds}`
            }

            // --- LOOT PROCESSING & TENT DEPOSIT PASS ---
            const totalTimeInSeconds = this.totalSurvivalTime / 1000
            const pMesh = this.player?.meshInstance ?? this.player?.mesh

            if (pMesh) {
                for (let i = this.activeItems.length - 1; i >= 0; i--) {
                    const item = this.activeItems[i]
                    item.update(totalTimeInSeconds)

                    if (item.mesh) {
                        const distanceToPlayer = pMesh.position.distanceTo(item.mesh.position)
                        if (distanceToPlayer < 1.4) {
                            this.playerCargoCount++
                            item.destroy()
                            this.activeItems.splice(i, 1)

                            const cargoHUD = document.getElementById('cargo-count')
                            if (cargoHUD) cargoHUD.innerText = this.playerCargoCount
                        }
                    }
                }

                const baseStructure = this.tent
                if (baseStructure && baseStructure.position && this.playerCargoCount > 0) {
                    const dx = pMesh.position.x - baseStructure.position.x
                    const dz = pMesh.position.z - baseStructure.position.z
                    const horizontalDistanceToTent = Math.sqrt(dx * dx + dz * dz)

                    if (horizontalDistanceToTent < 8.5) {
                        for (let i = 0; i < this.playerCargoCount; i++) {
                            if (typeof baseStructure.spawnStoredCrateVisual === 'function') {
                                baseStructure.spawnStoredCrateVisual();
                            }
                        }

                        this.tentStorageVault += this.playerCargoCount
                        this.playerCargoCount = 0

                        const cargoHUD = document.getElementById('cargo-count')
                        const tentHUD = document.getElementById('tent-stored-count')
                        if (cargoHUD) cargoHUD.innerText = this.playerCargoCount
                        if (tentHUD) tentHUD.innerText = this.tentStorageVault
                    }
                }
            }
        }

        this.drones.forEach((drone) => {
            drone.update()
        })
    }

    destroy() { }
}