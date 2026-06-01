import * as THREE from 'three'
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
        this.loadingStatusText = document.getElementById('loading-status-text')

        this.drones = []
        this.tent = null

        this.activeItems = []
        this.playerCargoCount = 0
        this.tentStorageVault = 0

        this.worldBuilt = false
        this.scoreSubmitted = false
        this.leaderboardId = null

        this.spawnTimer = 0
        this.spawnInterval = 30000
        this.waveMultiplier = 1
        this.totalDronesSpawned = 0
        this.availablePathsCount = 3

        this.totalSurvivalTime = 0

        this.countdownElement = document.getElementById('hud-countdown')
        this.totalTimeElement = document.getElementById('hud-total-time')
        this.chronoContainer = document.querySelector('.chrono-hud')

        this.minimapCanvas = document.getElementById('minimap')
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null
        this.minimapScale = 2.0

        this.init()
    }

    async init() {
        this.physics = new Physics()
        await this.physics.init()

        if (this.resources && this.resources.items && Object.keys(this.resources.items).length > 0) {
            console.log('[World] Production Cache verified successfully. Activating core layers...');
            this.buildGameWorld()

            if (this.loadingBar) this.loadingBar.style.width = '100%'
            if (this.loadingStatusText) this.loadingStatusText.innerText = "LINK ALLOCATION STABLE."

            if (typeof Wavedash !== 'undefined' && Wavedash.init) {
                Wavedash.init({ debug: true });

                Wavedash.getOrCreateLeaderboard(
                    "abyss_leaderboard",
                    Wavedash.LeaderboardSortOrder.DESC,
                    Wavedash.LeaderboardDisplayType.NUMERIC
                ).then((leaderboard) => {
                    if (leaderboard.success) {
                        this.leaderboardId = leaderboard.data.id;
                    }
                }).catch(err => console.error(err));
            }

            if (this.loadingScreen) {
                setTimeout(() => this.endLoadingScreen(), 300)
            }
            return;
        }

        if (this.resources) {
            this.resources.on('progress', (currentGroup, resource) => {
                if (currentGroup && currentGroup.toLoad > 0) {
                    const fraction = currentGroup.loaded / currentGroup.toLoad
                    const percentage = fraction * 100

                    if (this.loadingBar) {
                        this.loadingBar.style.width = `${percentage}%`
                    }

                    if (typeof Wavedash !== 'undefined' && Wavedash.updateLoadProgressZeroToOne) {
                        Wavedash.updateLoadProgressZeroToOne(fraction)
                    }

                    if (this.loadingStatusText && resource) {
                        this.loadingStatusText.innerText = `DECOMPRESSING MODULE: ${resource.name.toUpperCase()}...`
                    }
                }
            })

            this.resources.on('end', async () => {
                console.log('[World] Resources loaded fully. Assembling world graphs...')
                this.buildGameWorld()

                if (typeof Wavedash !== 'undefined' && Wavedash.updateLoadProgressZeroToOne) {
                    Wavedash.updateLoadProgressZeroToOne(1.0)
                }

                if (typeof Wavedash !== 'undefined' && Wavedash.init) {
                    Wavedash.init({ debug: true });

                    try {
                        console.log("[WAVEDASH] Resolving database metadata mapping configurations...");
                        const leaderboard = await Wavedash.getOrCreateLeaderboard(
                            "abyss_leaderboard",
                            Wavedash.LeaderboardSortOrder.DESC,
                            Wavedash.LeaderboardDisplayType.NUMERIC
                        );

                        if (leaderboard.success) {
                            this.leaderboardId = leaderboard.data.id;
                            console.log(`[WAVEDASH] Handshake successful. Cached ID: ${this.leaderboardId}`);
                        } else {
                            console.error("[WAVEDASH] Failed to get or create leaderboard record allocation.");
                        }
                    } catch (err) {
                        console.error("[WAVEDASH] Exception processing SDK startup handshakes:", err);
                    }
                }

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

        // FIXED: Removed the instant spawn line from here. 
        // The loop in your update() function will now naturally deploy the first wave after exactly 30 seconds.
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

            const gameHUD = document.getElementById('game-hud')
            if (gameHUD) {
                gameHUD.classList.remove('hidden')
            }

            setTimeout(() => {
                if (this.loadingScreen) this.loadingScreen.remove()
            }, 800)
        }
    }

    async refreshLeaderboardDisplay() {
        if (typeof Wavedash === 'undefined' || !this.leaderboardId) return;

        const response = await Wavedash.listLeaderboardEntries(this.leaderboardId, 0, 3, false);

        if (response.success && response.data) {
            console.log("[WAVEDASH] Live entries synchronized:", response.data);

            const overlay = document.getElementById('leaderboard-overlay');
            if (!overlay) return;

            const recordsBox = overlay.querySelector('div > div[style*="background: rgba(0,0,0,0.4)"]');
            if (recordsBox) {
                recordsBox.innerHTML = '<h3 style="font-size: 12px; color: #ffcc00; margin-top: 0; letter-spacing: 1px;">SHELTER ARCHIVE RECORDS</h3>';

                response.data.forEach((entry) => {
                    const row = document.createElement('div');
                    row.style.cssText = "display: flex; justify-content: space-between; font-size: 14px; margin: 6px 0; color: #aaa;";

                    if (entry.username && entry.username.toLowerCase() === "protocol-09") {
                        row.style.color = "#00ffcc";
                        row.style.fontWeight = "bold";
                    }

                    row.innerHTML = `
                        <span>${entry.globalRank}. ${entry.username.toUpperCase()}</span>
                        <span>${entry.score.toLocaleString()} PTS</span>
                    `;
                    recordsBox.appendChild(row);
                });
            }
        }
    }

    resize() { }

    update() {
        if (this.physics) this.physics.update()

        if (!this.worldBuilt) return

        const playerDeadState = this.player && this.player.isDead

        if (playerDeadState && !this.scoreSubmitted) {
            this.scoreSubmitted = true;

            const totalSeconds = Math.floor(this.totalSurvivalTime / 1000);
            const finalScore = (totalSeconds * 10) + (this.tentStorageVault * 100);

            console.log(`[GAME OVER] Finalizing score protocols. Score: ${finalScore}`);

            if (typeof Wavedash !== 'undefined' && this.leaderboardId) {
                Wavedash.uploadLeaderboardScore(this.leaderboardId, finalScore, true)
                    .then((response) => {
                        if (response.success) {
                            console.log(`[WAVEDASH] High score verified! Global Rank position: #${response.data.globalRank}`);
                            this.refreshLeaderboardDisplay();
                        } else {
                            console.warn("[WAVEDASH] Server accepted payload package transaction but rejected update bounds validation.");
                        }
                    })
                    .catch((error) => {
                        console.error("[WAVEDASH] Cloud sync transaction network exception:", error);
                    });
            } else {
                console.warn("[WAVEDASH] Upload aborted: SDK instance context lost or target Leaderboard ID unresolved.");
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

        if (this.minimapCtx && this.player && this.player.meshInstance) {
            const ctx = this.minimapCtx
            const width = this.minimapCanvas.width
            const height = this.minimapCanvas.height
            const centerX = width / 2
            const centerY = height / 2
            const radius = width / 2

            ctx.clearRect(0, 0, width, height)

            ctx.fillStyle = "rgba(8, 9, 12, 0.65)"
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
            ctx.fill()

            ctx.strokeStyle = "rgba(255, 17, 0, 0.3)"
            ctx.lineWidth = 2
            ctx.stroke()
            ctx.strokeStyle = "rgba(255, 17, 0, 0.1)"
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2)
            ctx.stroke()

            ctx.beginPath()
            ctx.moveTo(centerX, 0)
            ctx.lineTo(centerX, height)
            ctx.moveTo(0, centerY)
            ctx.lineTo(width, centerY)
            ctx.stroke()

            const playerPos = this.player.meshInstance.position

            const playerAngle = this.player.meshInstance.rotation.y


            const projectCoordinates = (targetX, targetZ) => {
                const dx = targetX - playerPos.x
                const dz = targetZ - playerPos.z


                const rotatedX = dx * Math.cos(-playerAngle) - dz * Math.sin(-playerAngle)
                const rotatedZ = dx * Math.sin(-playerAngle) + dz * Math.cos(-playerAngle)

                const blipX = centerX + (rotatedX * this.minimapScale)
                const blipZ = centerY + (rotatedZ * this.minimapScale)

                return { x: blipX, z: blipZ }
            }

            if (this.tent && this.tent.position) {
                const tentBlip = projectCoordinates(this.tent.position.x, this.tent.position.z)

                const distFromCenter = Math.sqrt(Math.pow(tentBlip.x - centerX, 2) + Math.pow(tentBlip.z - centerY, 2))
                if (distFromCenter < radius - 4) {
                    ctx.fillStyle = "#ffcc00"
                    ctx.beginPath()
                    ctx.rect(tentBlip.x - 4, tentBlip.z - 4, 8, 8)
                    ctx.fill()
                }
            }

            this.drones.forEach((drone) => {
               
                const droneMesh = drone.droneGroup;

               
                if (droneMesh && !drone.hasBeenHit) {
                    const droneBlip = projectCoordinates(droneMesh.position.x, droneMesh.position.z)

                    const distFromCenter = Math.sqrt(Math.pow(droneBlip.x - centerX, 2) + Math.pow(droneBlip.z - centerY, 2))

                  
                    let drawX = droneBlip.x
                    let drawZ = droneBlip.z
                    if (distFromCenter > radius - 5) {
                        const angle = Math.atan2(droneBlip.z - centerY, droneBlip.x - centerX)
                        drawX = centerX + Math.cos(angle) * (radius - 6)
                        drawZ = centerY + Math.sin(angle) * (radius - 6)
                    }

                    ctx.fillStyle = "#ff1100" 
                    ctx.beginPath()
                    ctx.arc(drawX, drawZ, 3.5, 0, Math.PI * 2)
                    ctx.fill()
                }
            })

            ctx.fillStyle = "#00ffcc"
            ctx.shadowColor = "#00ffcc"
            ctx.shadowBlur = 5

            ctx.beginPath()
            ctx.moveTo(centerX, centerY - 6)
            ctx.lineTo(centerX - 5, centerY + 5)
            ctx.lineTo(centerX + 5, centerY + 5)
            ctx.closePath()
            ctx.fill()

            ctx.shadowBlur = 0
        }
    }

    destroy() { }
}