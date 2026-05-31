import Experience from '../sources/Experience/Experience.js'
import Wavedash from "@wvdsh/sdk-js"

try {
    console.log("[Wavedash] Establishing top-level sandbox handshake...");
    Wavedash.init({ debug: true });
} catch (error) {
    console.warn("[Wavedash Warning] Running outside platform wrapper sandbox.", error.message);
}

const initGame = () => {
    const mainMenu = document.getElementById('main-menu');
    const controlsModal = document.getElementById('controls-modal');
    const loadingScreen = document.getElementById('loading-screen');
    const gameHud = document.getElementById('game-hud');
    const storyScreen = document.getElementById('story-screen');

    const startGameBtn = document.getElementById('start-game-btn');
    const controlsBtn = document.getElementById('controls-btn');
    const closeControlsBtn = document.getElementById('close-controls-btn');
    const quitGameBtn = document.getElementById('quit-game-btn');
    const closeStoryBtn = document.getElementById('close-story-btn');

    let gameStarted = false;
    let experienceInstance = null;

    const revealGameUI = () => {
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (gameHud) gameHud.classList.remove('hidden');
        console.log("[HUD] System channels connected. Displaying tactical overlay.");
        
        try {
            Wavedash.loadComplete();
        } catch (e) {}
    };

    const bootGameEngine = () => {
        if (storyScreen) storyScreen.classList.add('hidden');
        if (loadingScreen) loadingScreen.classList.remove('hidden');

        let targetEl = document.querySelector('.experience');
        if (!targetEl) {
            console.warn("[System] Class '.experience' div missing. Searching alternative root nodes...");
            targetEl = document.getElementById('experience') || document.body;
        }

        experienceInstance = new Experience({
            targetElement: targetEl
        });

        if (experienceInstance.resources) {
            // If your Experience class emits individual item load updates, map them here:
            experienceInstance.resources.on('progress', (progressRatio) => {
                try {
                    // progressRatio should be a decimal value between 0.0 and 1.0
                    Wavedash.updateLoadProgressZeroToOne(progressRatio);
                } catch (e) {}
            });

            experienceInstance.resources.on('ready', () => {
                revealGameUI();
            });

            experienceInstance.resources.on('loaded', () => {
                revealGameUI();
            });

            setTimeout(() => {
                if (gameHud && gameHud.classList.contains('hidden')) {
                    console.warn("[System] Resource lifecycle event timed out. Initializing UI fallback override...");
                    revealGameUI();
                }
            }, 1200);
        } else {
            // Fallback if no resource class exists
            try { Wavedash.updateLoadProgressZeroToOne(0.5); } catch(e){}
            setTimeout(() => {
                revealGameUI();
            }, 1000);
        }
    };

    startGameBtn.addEventListener('click', () => {
        if (gameStarted) return;
        gameStarted = true;

        mainMenu.classList.add('hidden');

        const hasSeenStory = localStorage.getItem('abyss_story_complete');

        if (hasSeenStory === 'true') {
            console.log("[System] Valid signature file detected. Skipping narrative core sequence.");
            bootGameEngine();
        } else {
            console.log("[System] Identity signature not recorded. Redirecting to tactical background briefing...");
            if (storyScreen) {
                storyScreen.classList.remove('hidden');
            } else {
                bootGameEngine();
            }
        }
    });

    if (closeStoryBtn) {
        closeStoryBtn.addEventListener('click', () => {
            localStorage.setItem('abyss_story_complete', 'true');
            console.log("[System] Briefing acknowledged. Setting persistent story authorization flag.");
            
            bootGameEngine();
        });
    }

    controlsBtn.addEventListener('click', () => {
        if (controlsModal) controlsModal.classList.remove('hidden');
    });

    closeControlsBtn.addEventListener('click', () => {
        if (controlsModal) controlsModal.classList.add('hidden');
    });

    quitGameBtn.addEventListener('click', () => {
        if (confirm("SYSTEM WARNING: DISCONNECT FROM TERMINAL LINK?")) {
            console.log("[System] Connection terminated by user command.");
            window.close();
            window.location.href = "about:blank"; 
        }
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}