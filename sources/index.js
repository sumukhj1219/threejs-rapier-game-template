import Experience from '../sources/Experience/Experience.js'

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // UI LAYERS & OVERLAYS
    // ==========================================================================
    const mainMenu = document.getElementById('main-menu');
    const controlsModal = document.getElementById('controls-modal');
    const loadingScreen = document.getElementById('loading-screen');
    const gameHud = document.getElementById('game-hud');
    const storyScreen = document.getElementById('story-screen');

    // ==========================================================================
    // INTERACTIVE BUTTON COMPONENTS
    // ==========================================================================
    const startGameBtn = document.getElementById('start-game-btn');
    const controlsBtn = document.getElementById('controls-btn');
    const closeControlsBtn = document.getElementById('close-controls-btn');
    const quitGameBtn = document.getElementById('quit-game-btn');
    const closeStoryBtn = document.getElementById('close-story-btn');

    let gameStarted = false;
    let experienceInstance = null;

    // ==========================================================================
    // APPLICATION ENGINE LIFECYCLE CONTROLLERS
    // ==========================================================================
    
    /**
     * Safely strips away loader overlays and reveals the reactive gameplay HUD panel.
     */
    const revealGameUI = () => {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (gameHud) gameHud.classList.remove('hidden');
        console.log("[HUD] System channels connected. Displaying tactical overlay.");
    };

    /**
     * Instantiates the WebGL game instance, anchors it to the DOM container,
     * and handles resource loading events before activating the gameplay interface.
     */
    const bootGameEngine = () => {
        // Clear out any previous cinematic narrative frames
        if (storyScreen) storyScreen.classList.add('hidden');
        if (loadingScreen) loadingScreen.classList.remove('hidden');

        // Locate target container element
        let targetEl = document.querySelector('.experience');
        if (!targetEl) {
            console.warn("[System] Class '.experience' div missing. Searching alternative root nodes...");
            targetEl = document.getElementById('experience') || document.body;
        }

        // Initialize the Core Three.js Engine inside an configuration object
        experienceInstance = new Experience({
            targetElement: targetEl
        });

        // Intercept asset loader pipelines to orchestrate transition sequence
        if (experienceInstance.resources) {
            // Scenario A: Standard EventEmitter 'ready' hook
            experienceInstance.resources.on('ready', () => {
                revealGameUI();
            });

            // Scenario B: Alternative 'loaded' hook variation matching custom loaders
            experienceInstance.resources.on('loaded', () => {
                revealGameUI();
            });

            // Scenario C: Safe timeout backup just in case asynchronous events fail to report back
            setTimeout(() => {
                if (gameHud && gameHud.classList.contains('hidden')) {
                    console.warn("[System] Resource lifecycle event timed out. Initializing UI fallback override...");
                    revealGameUI();
                }
            }, 1200);
        } else {
            // Instant mechanical fallback if resource manager doesn't run explicit events
            setTimeout(() => {
                revealGameUI();
            }, 1000);
        }
    };

    // ==========================================================================
    // EVENT LISTENERS & LINK HANDLERS
    // ==========================================================================

    // 1. START SIMULATION PROCESS
    startGameBtn.addEventListener('click', () => {
        if (gameStarted) return;
        gameStarted = true;

        // Animate main layer out of view
        mainMenu.classList.add('hidden');

        // Check user clearance footprint inside local browser profile
        const hasSeenStory = localStorage.getItem('abyss_story_complete');

        if (hasSeenStory === 'true') {
            // Returning Veteran: Bypass cinematic brief and drop directly to combat loading
            console.log("[System] Valid signature file detected. Skipping narrative core sequence.");
            bootGameEngine();
        } else {
            // First-Time Recruit: Reveal narrative briefing terminal overlay
            console.log("[System] Identity signature not recorded. Redirecting to tactical background briefing...");
            if (storyScreen) {
                storyScreen.classList.remove('hidden');
            } else {
                // Emergency fail-safe drop if story screen element is wiped out or altered in HTML
                bootGameEngine();
            }
        }
    });

    // 2. STORY DISMISS PROTOCOL
    if (closeStoryBtn) {
        closeStoryBtn.addEventListener('click', () => {
            // Record confirmation flag locally so they never have to view this segment again
            localStorage.setItem('abyss_story_complete', 'true');
            console.log("[System] Briefing acknowledged. Setting persistent story authorization flag.");
            
            // Hand over execution pipeline to the primary graphics loop loader
            bootGameEngine();
        });
    }

    // 3. TACTICAL OPTIONS LAYOUT INTERACTION
    controlsBtn.addEventListener('click', () => {
        if (controlsModal) controlsModal.classList.remove('hidden');
    });

    closeControlsBtn.addEventListener('click', () => {
        if (controlsModal) controlsModal.classList.add('hidden');
    });

    // 4. CONNECTION CLOSE / TERMINATION HANDLER
    quitGameBtn.addEventListener('click', () => {
        if (confirm("SYSTEM WARNING: DISCONNECT FROM TERMINAL LINK?")) {
            console.log("[System] Connection terminated by user command.");
            window.close();
            window.location.href = "about:blank"; // Fallback destination string if window restriction blocks close execution
        }
    });
});