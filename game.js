import { CONFIG } from './config.js';
import { canvas, ctx, metrics, gameState, player, obstacles, collectibles, obstaclePool, collectiblePool } from './state.js';
import { setupInputHandlers, showControls } from './input.js';
import { drawScene, loadImages } from './render.js';

// Sprite animations for all game objects
const sprites = {
    dogs: {
        alpha: [],   // Lead dog - 4 frames
        derpy: [],   // Middle dog - 3 frames
        female: []   // Back dog - 3 frames
    },
    collectibles: {
        fox: [],     // Arctic fox - 3 frames
        seal: []     // Seal - 3 frames
    },
    obstacles: {
        bear: [],    // Polar bear - 3 frames
        iceberg: [], // Icebergs - 3 types
        polynya: []  // Polynyas (openings) - 2 types
    },
    hunter: [],      // Hunter on sled - 3 frames
    sled: null       // Dog sled - 1 image
};

let framesLoaded = 0;
const totalAssetGroups = 10;

// Load alpha dog (lead position)
loadImages(
    ['assets-webp/alpha-dog-frame-1.webp', 'assets-webp/alpha-dog-frame-2.webp', 
     'assets-webp/alpha-dog-frame-3.webp', 'assets-webp/alpha-dog-frame-4.webp'],
    (images) => { sprites.dogs.alpha = images; framesLoaded++; checkAllLoaded(); }
);

// Load derpy dog (middle position)
loadImages(
    ['assets-webp/derpy-dog-frame-1.webp', 'assets-webp/derpy-dog-frame-2.webp', 
     'assets-webp/derpy-dog-frame-3.webp'],
    (images) => { sprites.dogs.derpy = images; framesLoaded++; checkAllLoaded(); }
);

// Load female dog (back position)
loadImages(
    ['assets-webp/female-dog-frame-1.webp', 'assets-webp/female-dog-frame-2.webp', 
     'assets-webp/female-dog-frame-3.webp'],
    (images) => { sprites.dogs.female = images; framesLoaded++; checkAllLoaded(); }
);

// Load arctic fox
loadImages(
    ['assets-webp/arctic-fox-frame-1.webp', 'assets-webp/arctic-fox-frame-2.webp', 
     'assets-webp/arctic-fox-frame-3.webp'],
    (images) => { sprites.collectibles.fox = images; framesLoaded++; checkAllLoaded(); }
);

// Load seal
loadImages(
    ['assets-webp/seal-frame-1.webp', 'assets-webp/seal-frame-2.webp', 
     'assets-webp/seal-frame-3.webp'],
    (images) => { sprites.collectibles.seal = images; framesLoaded++; checkAllLoaded(); }
);

// Load polar bear
loadImages(
    ['assets-webp/polar-bear-frame-1.webp', 'assets-webp/polar-bear-frame-2.webp', 
     'assets-webp/polar-bear-frame-3.webp'],
    (images) => { sprites.obstacles.bear = images; framesLoaded++; checkAllLoaded(); }
);

// Load icebergs
loadImages(
    ['assets-webp/iceberg-type-1.webp', 'assets-webp/iceberg-type-2.webp', 
     'assets-webp/iceberg-type-3.webp'],
    (images) => { sprites.obstacles.iceberg = images; framesLoaded++; checkAllLoaded(); }
);

// Load polynyas (openings)
loadImages(
    ['assets-webp/polynya-1.webp', 'assets-webp/polynya-2.webp'],
    (images) => { sprites.obstacles.polynya = images; framesLoaded++; checkAllLoaded(); }
);

// Load hunter
loadImages(
    ['assets-webp/hunter-sitting-on-sled-frame-1.webp', 'assets-webp/hunter-sitting-on-sled-frame-2.webp', 
     'assets-webp/hunter-sitting-on-sled-frame-3.webp'],
    (images) => { sprites.hunter = images; framesLoaded++; checkAllLoaded(); }
);

// Load dog sled
loadImages(
    ['assets-webp/dog-sled.webp'],
    (images) => { sprites.sled = images[0]; framesLoaded++; checkAllLoaded(); }
);

function checkAllLoaded() {
    if (framesLoaded === totalAssetGroups) {
        console.log("All game sprites loaded successfully!");
    }
}

const LANE_COUNT = CONFIG.LANE_COUNT;
let lastTime = 0;

function initPools() {
    obstaclePool.length = 0;
    collectiblePool.length = 0;
    for (let i = 0; i < CONFIG.POOL_SIZE; i++) {
        obstaclePool.push({ active: false, type: '', lane: 0, x: 0, width: 0, height: 0, subtype: 0 });
        collectiblePool.push({ active: false, type: '', lane: 0, x: 0, width: 0, height: 0 });
    }
}

function getFromPool(pool, type, lane, x, width, height, scale = 1, subtype = 0) {
    for (let obj of pool) {
        if (!obj.active) {
            obj.active = true;
            obj.type = type;
            obj.lane = lane;
            obj.x = x;
            obj.width = width;
            obj.height = height;
            obj.scale = scale;
            obj.subtype = subtype;
            return obj;
        }
    }
    const newObj = { active: true, type, lane, x, width, height, scale, subtype };
    pool.push(newObj);
    return newObj;
}

function returnToPool(obj) {
    obj.active = false;
}

function getViewportSize() {
    if (window.visualViewport) {
        return { width: window.visualViewport.width, height: window.visualViewport.height };
    }
    return { width: window.innerWidth, height: window.innerHeight };
}

function isPortrait() {
    const vw = getViewportSize();
    return vw.height > vw.width;
}

function applyPortraitConfig() {
    metrics.GAME_WIDTH = CONFIG.PORTRAIT_GAME_WIDTH || 450;
    metrics.GAME_HEIGHT = CONFIG.PORTRAIT_GAME_HEIGHT || 800;
    player.x = CONFIG.PORTRAIT_PLAYER_X || (metrics.GAME_WIDTH * 0.18);
    player.width = CONFIG.PORTRAIT_PLAYER_WIDTH || Math.round(CONFIG.PLAYER_WIDTH * (metrics.GAME_WIDTH / CONFIG.GAME_WIDTH));
    player.height = CONFIG.PORTRAIT_PLAYER_HEIGHT || Math.round(CONFIG.PLAYER_HEIGHT * (metrics.GAME_HEIGHT / CONFIG.GAME_HEIGHT));
}

function applyLandscapeConfig() {
    metrics.GAME_WIDTH = CONFIG.GAME_WIDTH;
    metrics.GAME_HEIGHT = CONFIG.GAME_HEIGHT;
    player.x = CONFIG.PLAYER_X;
    player.width = CONFIG.PLAYER_WIDTH;
    player.height = CONFIG.PLAYER_HEIGHT;
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    if (isPortrait()) {
        applyPortraitConfig();
    } else {
        applyLandscapeConfig();
    }

    try { showControls(isPortrait() || getViewportSize().width < 800); } catch (err) {}

    const aspectRatio = metrics.GAME_WIDTH / metrics.GAME_HEIGHT;
    const vw = getViewportSize();
    let canvasWidth = vw.width;
    let canvasHeight = vw.height;

    if (canvasWidth / canvasHeight > aspectRatio) {
        canvasWidth = canvasHeight * aspectRatio;
    } else {
        canvasHeight = canvasWidth / aspectRatio;
    }

    canvas.style.width = canvasWidth + 'px';
    canvas.style.height = canvasHeight + 'px';
    canvas.width = metrics.GAME_WIDTH * dpr;
    canvas.height = metrics.GAME_HEIGHT * dpr;

    if (ctx.setTransform) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
        ctx.scale(dpr, dpr);
    }

    metrics.scale = canvasWidth / metrics.GAME_WIDTH;
    metrics.offsetX = (vw.width - canvasWidth) / 2;
    metrics.offsetY = (vw.height - canvasHeight) / 2;

    metrics.LANE_HEIGHT = metrics.GAME_HEIGHT / LANE_COUNT;
    if (isPortrait()) {
        const pad = metrics.LANE_HEIGHT * CONFIG.PORTRAIT_LANE_PADDING;
        metrics.LANE_HEIGHT = (metrics.GAME_HEIGHT - pad * (LANE_COUNT - 1)) / LANE_COUNT;
    }

    if (!player.x) player.x = Math.round(metrics.GAME_WIDTH * 0.18);
}

function handleVisibilityChange() {
    if (document.hidden) {
        gameState.isPaused = true;
    } else {
        gameState.isPaused = false;
        lastTime = performance.now();
    }
}

function runScalingAndCollisionTests() {
    const orig = {
        gameWidth: metrics.GAME_WIDTH,
        gameHeight: metrics.GAME_HEIGHT,
        playerX: player.x,
        playerWidth: player.width,
        playerHeight: player.height
    };

    function testScenario(portrait) {
        if (portrait) applyPortraitConfig(); else applyLandscapeConfig();
        metrics.LANE_HEIGHT = metrics.GAME_HEIGHT / LANE_COUNT;
        if (isPortrait()) {
            const pad = metrics.LANE_HEIGHT * CONFIG.PORTRAIT_LANE_PADDING;
            metrics.LANE_HEIGHT = (metrics.GAME_HEIGHT - pad * (LANE_COUNT - 1)) / LANE_COUNT;
        }

        const p = { lane: 1, x: player.x, width: player.width, height: player.height };
        const obs = { lane: 1, x: p.x + p.width - 10, width: 50, height: metrics.LANE_HEIGHT * 0.7 };
        const obScale = portrait ? CONFIG.PORTRAIT_OBSTACLE_SCALE : 1;
        obs.width = Math.round(obs.width * obScale);
        obs.height = Math.round(obs.height * obScale);

        const collision = checkCollision(p, obs);
        const obj1Y = p.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
        const obj2Y = obs.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
        const yOverlap = Math.abs(obj1Y - obj2Y) < (p.height + obs.height) / 2;
        const xOverlap = p.x < obs.x + obs.width && p.x + p.width > obs.x;
        const manual = yOverlap && xOverlap;

        console.log(`Test ${portrait ? 'Portrait' : 'Landscape'}; player w/h ${p.width}/${p.height}; obs w/h ${obs.width}/${obs.height}; LANE_HEIGHT ${metrics.LANE_HEIGHT}; collision ${collision} (manual:${manual})`);
        return collision === manual;
    }

    const landscapeOK = testScenario(false);
    const portraitOK = testScenario(true);
    const tinyOK = (() => {
        const prevW = CONFIG.PORTRAIT_GAME_WIDTH;
        const prevH = CONFIG.PORTRAIT_GAME_HEIGHT;
        CONFIG.PORTRAIT_GAME_WIDTH = 360;
        CONFIG.PORTRAIT_GAME_HEIGHT = 780;
        const ok = testScenario(true);
        CONFIG.PORTRAIT_GAME_WIDTH = prevW;
        CONFIG.PORTRAIT_GAME_HEIGHT = prevH;
        return ok;
    })();

    metrics.GAME_WIDTH = orig.gameWidth;
    metrics.GAME_HEIGHT = orig.gameHeight;
    player.x = orig.playerX;
    player.width = orig.playerWidth;
    player.height = orig.playerHeight;
    resizeCanvas();

    console.log('Scaling/collision tests passed (landscape, portrait, tinyPhone):', landscapeOK, portraitOK, tinyOK);
    return landscapeOK && portraitOK && tinyOK;
}

function resetGame() {
    gameState.score = 0;
    gameState.gameSpeed = CONFIG.BASE_SPEED;
    gameState.isGameOver = false;
    gameState.hasStarted = false;
    gameState.isInvincible = false;
    gameState.invincibleTimer = 0;
    gameState.lastInvincibleMilestone = 0;
    gameState.spawnTimer = 0;
    gameState.animTime = 0;
    gameState.elapsedTime = 0;
    gameState.pendingInput = null;
    gameState.inputBufferTimer = 0;
    gameState.hasMovedUp = false;
    gameState.hasMovedDown = false;
    gameState.tutorialTimer = 0;
    gameState.hunterFrame = 0;
    gameState.hunterFrameTimer = 0;
    gameState.isCrashing = false;
    gameState.crashShakeTimer = 0;

    player.lane = 1;
    player.targetLane = 1;
    player.isTransitioning = false;

    if (isPortrait()) applyPortraitConfig(); else applyLandscapeConfig();

    obstacles.forEach(returnToPool);
    collectibles.forEach(returnToPool);
    obstacles.length = 0;
    collectibles.length = 0;
}

function spawnObject() {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const type = Math.random();
    const obScale = isPortrait() ? CONFIG.PORTRAIT_OBSTACLE_SCALE : 1;
    let cumulative = 0;

    cumulative += CONFIG.PROB_FOX;
    if (type < cumulative) {
        const w = Math.round(40 * obScale);
        const h = Math.round(30 * obScale);
        const obj = getFromPool(collectiblePool, 'fox', lane, metrics.GAME_WIDTH, w, h, obScale);
        collectibles.push(obj);
        return;
    }

    cumulative += CONFIG.PROB_SEAL;
    if (type < cumulative) {
        const w = Math.round(45 * obScale);
        const h = Math.round(35 * obScale);
        const obj = getFromPool(collectiblePool, 'seal', lane, metrics.GAME_WIDTH, w, h, obScale);
        collectibles.push(obj);
        return;
    }

    cumulative += CONFIG.PROB_BEAR;
    if (type < cumulative) {
        const w = Math.round(70 * obScale);
        const h = Math.round(60 * obScale);
        const obj = getFromPool(obstaclePool, 'bear', lane, metrics.GAME_WIDTH, w, h, obScale);
        obstacles.push(obj);
        return;
    }

    cumulative += CONFIG.PROB_ICEBERG;
    if (type < cumulative) {
        const w = Math.round(60 * obScale);
        const h = Math.round(80 * obScale);
        const subtype = Math.floor(Math.random() * 3); // Random iceberg type (0-2)
        const obj = getFromPool(obstaclePool, 'iceberg', lane, metrics.GAME_WIDTH, w, h, obScale, subtype);
        obstacles.push(obj);
        return;
    }

    const w = Math.round(80 * obScale);
    const h = Math.round(metrics.LANE_HEIGHT * obScale);
    const subtype = Math.floor(Math.random() * 2); // Random polynya type (0-1)
    const obj = getFromPool(obstaclePool, 'opening', lane, metrics.GAME_WIDTH, w, h, obScale, subtype);
    obstacles.push(obj);
}

function checkCollision(obj1, obj2) {
    const obj1Y = obj1.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
    const obj2Y = obj2.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
    const yOverlap = Math.abs(obj1Y - obj2Y) < (obj1.height + obj2.height) / 2;
    return yOverlap &&
        obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x;
}

function updatePlayer(dt) {
    if (player.lane !== player.targetLane) {
        player.isTransitioning = true;
        const direction = player.targetLane > player.lane ? 1 : -1;
        player.lane += direction * player.laneTransitionSpeed * dt;
        if (direction > 0 && player.lane >= player.targetLane) {
            player.lane = player.targetLane;
            player.isTransitioning = false;
        } else if (direction < 0 && player.lane <= player.targetLane) {
            player.lane = player.targetLane;
            player.isTransitioning = false;
        }
    } else {
        player.isTransitioning = false;
    }

    if (!player.isTransitioning && gameState.pendingInput && gameState.inputBufferTimer > 0) {
        if (gameState.pendingInput === 'up') {
            player.targetLane = Math.max(0, player.targetLane - 1);
        } else if (gameState.pendingInput === 'down') {
            player.targetLane = Math.min(LANE_COUNT - 1, player.targetLane + 1);
        }
        gameState.pendingInput = null;
        gameState.inputBufferTimer = 0;
    }

    if (gameState.inputBufferTimer > 0) {
        gameState.inputBufferTimer -= dt;
        if (gameState.inputBufferTimer <= 0) {
            gameState.pendingInput = null;
        }
    }
}

function updateDifficulty(dt) {
    gameState.elapsedTime += dt;
    if (CONFIG.SPEED_GROWTH_TYPE === 'sqrt') {
        gameState.gameSpeed = CONFIG.BASE_SPEED + CONFIG.SPEED_GROWTH * Math.sqrt(gameState.score);
    } else {
        gameState.gameSpeed = CONFIG.BASE_SPEED + CONFIG.SPEED_GROWTH * gameState.score;
    }
}

function updateInvincibility(dt) {
    if (gameState.isInvincible) {
        gameState.invincibleTimer -= dt;
        if (gameState.invincibleTimer <= 0) {
            gameState.isInvincible = false;
            gameState.invincibleTimer = 0;
        }
    }

    const currentMilestone = Math.floor(gameState.score / CONFIG.INVINCIBILITY_MILESTONE) * CONFIG.INVINCIBILITY_MILESTONE;
    if (currentMilestone > gameState.lastInvincibleMilestone && currentMilestone > 0) {
        gameState.isInvincible = true;
        gameState.invincibleTimer = CONFIG.INVINCIBILITY_DURATION;
        gameState.lastInvincibleMilestone = currentMilestone;
    }
}

function updateSpawning(dt) {
    gameState.spawnTimer -= dt;
    if (gameState.spawnTimer <= 0) {
        spawnObject();
        gameState.spawnTimer = CONFIG.BASE_SPAWN_INTERVAL - (gameState.score * CONFIG.SPAWN_SPEED_UP);
        gameState.spawnTimer = Math.max(CONFIG.MIN_SPAWN_INTERVAL, gameState.spawnTimer);
    }
}

function updateObstacles(dt) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= gameState.gameSpeed * dt;

        if (obs.x + obs.width < 0) {
            returnToPool(obs);
            obstacles.splice(i, 1);
            continue;
        }

        if (checkCollision(player, obs) && !gameState.isInvincible) {
            gameState.hunterFrame = 2; // Crash frame
            gameState.hunterFrameTimer = 0;
            gameState.isCrashing = true;
            gameState.crashShakeTimer = 0.4; // Quick shake for 0.4 seconds before game over
        }
    }
}

function updateCollectibles(dt) {
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const col = collectibles[i];
        col.x -= gameState.gameSpeed * dt;

        if (col.x + col.width < 0) {
            returnToPool(col);
            collectibles.splice(i, 1);
            continue;
        }

        if (checkCollision(player, col)) {
            gameState.hunterFrame = 1; // Collection frame
            gameState.hunterFrameTimer = 0.8; // Show for 0.8 seconds
            if (col.type === 'seal') {
                gameState.score += CONFIG.SEAL_POINTS;
            } else if (col.type === 'fox') {
                gameState.score += CONFIG.FOX_POINTS;
            }
            returnToPool(col);
            collectibles.splice(i, 1);
        }
    }
}

function update(dt) {
    if (!gameState.hasStarted || gameState.isGameOver || gameState.isPaused) return;

    gameState.animTime += dt;
    gameState.tutorialTimer += dt;

    // Stop dog animations and movement when crashing
    if (!gameState.isCrashing) {
        // Dog animation - cycle through frames
        const frameDuration = 150; // ms per frame
        gameState.dogAnimationTimer += dt * 1000;
        if (gameState.dogAnimationTimer >= frameDuration) {
            gameState.currentDogFrame = (gameState.currentDogFrame + 1) % 4; // Max 4 frames for alpha
            gameState.dogAnimationTimer = 0;
        }
    }

    // Hunter frame timer - return to idle after collection animation
    if (gameState.hunterFrameTimer > 0) {
        gameState.hunterFrameTimer -= dt;
        if (gameState.hunterFrameTimer <= 0) {
            gameState.hunterFrame = 0; // Back to idle
        }
    }

    // Crash shake timer - show game over after shake animation
    if (gameState.isCrashing && gameState.crashShakeTimer > 0) {
        gameState.crashShakeTimer -= dt;
        if (gameState.crashShakeTimer <= 0) {
            gameState.isGameOver = true;
            if (gameState.score > gameState.bestScore) {
                gameState.bestScore = gameState.score;
                localStorage.setItem('dogsledBestScore', gameState.bestScore);
            }
        }
    }

    if (!gameState.isCrashing) {
        updatePlayer(dt);
        updateDifficulty(dt);
        updateInvincibility(dt);
        updateSpawning(dt);
        updateObstacles(dt);
        updateCollectibles(dt);
    }
}

function gameLoop(timestamp) {
    const prevTime = lastTime;
    const dt = Math.min((timestamp - lastTime) / 1000, CONFIG.MAX_DELTA_TIME);
    lastTime = timestamp;

    update(dt);
    const poolSize = obstaclePool.length + collectiblePool.length;
    drawScene(ctx, metrics, gameState, player, obstacles, collectibles, poolSize, CONFIG, prevTime, sprites);

    requestAnimationFrame(gameLoop);
}

function wireResizeListeners() {
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resizeCanvas);
        window.visualViewport.addEventListener('scroll', resizeCanvas);
    }
}

function wireVisibilityChange() {
    document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyT') {
                console.log('Running scaling/collision tests...');
                const ok = runScalingAndCollisionTests();
                console.log('Tests result:', ok ? 'OK' : 'FAIL');
            }
        });
}

const controlUp = document.getElementById('controlUp');
const controlDown = document.getElementById('controlDown');

setupInputHandlers({ canvas, controlUp, controlDown, resetGame });
wireResizeListeners();
wireVisibilityChange();

initPools();
resizeCanvas();
resetGame();
lastTime = performance.now();
requestAnimationFrame(gameLoop);
