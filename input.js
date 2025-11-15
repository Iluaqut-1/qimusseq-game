import { CONFIG } from './config.js';
import { metrics, gameState, player } from './state.js';

let controlUpEl = null;
let controlDownEl = null;
let currentCanvas;

export function handleInput(direction) {
    if (gameState.isGameOver || !gameState.hasStarted) return;

    if (direction === 'up') gameState.hasMovedUp = true;
    if (direction === 'down') gameState.hasMovedDown = true;

    if (!player.isTransitioning) {
        if (direction === 'up') {
            player.targetLane = Math.max(0, player.targetLane - 1);
        } else if (direction === 'down') {
            player.targetLane = Math.min(CONFIG.LANE_COUNT - 1, player.targetLane + 1);
        }
    } else {
        gameState.pendingInput = direction;
        gameState.inputBufferTimer = CONFIG.INPUT_BUFFER_TIME;
    }
}

export function showControls(show) {
    if (!controlUpEl || !controlDownEl) return;
    if (!CONFIG.SHOW_ONSCREEN_CONTROLS) {
        controlUpEl.style.display = 'none';
        controlDownEl.style.display = 'none';
        return;
    }
    controlUpEl.style.display = show ? 'flex' : 'none';
    controlDownEl.style.display = show ? 'flex' : 'none';
}

export function setupInputHandlers({ canvas, controlUp, controlDown, resetGame }) {
    controlUpEl = controlUp;
    controlDownEl = controlDown;
    currentCanvas = canvas;

    document.addEventListener('keydown', (e) => {
        if (gameState.isGameOver) {
            if (e.code === 'Space') {
                resetGame();
            }
            return;
        }

        if (!gameState.hasStarted) {
            gameState.hasStarted = true;
            return;
        }

        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
            handleInput('up');
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
            handleInput('down');
        }
    });

    let touchStartY = null;
    let touchMoved = false;

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartY = touch.clientY;
        touchMoved = false;

        if (gameState.isGameOver) {
            resetGame();
            return;
        }

        if (!gameState.hasStarted) {
            gameState.hasStarted = true;
            return;
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        touchMoved = true;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (gameState.isGameOver || !touchStartY) return;

        const touch = e.changedTouches[0];
        const dy = touch.clientY - touchStartY;
        const swipeThreshold = 30;
        const rect = canvas.getBoundingClientRect();
        const y = (touch.clientY - rect.top) / metrics.scale;

        if (touchMoved && Math.abs(dy) > swipeThreshold) {
            if (dy < 0) handleInput('up');
            else handleInput('down');
        } else {
            if (y < metrics.GAME_HEIGHT / 2) {
                handleInput('up');
            } else {
                handleInput('down');
            }
        }

        touchStartY = null;
        touchMoved = false;
    }, { passive: false });

    controlUp.addEventListener('pointerdown', (e) => { e.preventDefault(); handleInput('up'); });
    controlDown.addEventListener('pointerdown', (e) => { e.preventDefault(); handleInput('down'); });

    canvas.addEventListener('click', (e) => {
        if (gameState.isGameOver) {
            resetGame();
            return;
        }

        if (!gameState.hasStarted) {
            gameState.hasStarted = true;
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const y = (e.clientY - rect.top) / metrics.scale;

        if (y < metrics.GAME_HEIGHT / 2) {
            handleInput('up');
        } else {
            handleInput('down');
        }
    });
}
