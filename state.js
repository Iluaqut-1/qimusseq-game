import { CONFIG } from './config.js';

export const canvas = document.getElementById('gameCanvas');
export const ctx = canvas.getContext('2d');

export const metrics = {
    GAME_WIDTH: CONFIG.GAME_WIDTH,
    GAME_HEIGHT: CONFIG.GAME_HEIGHT,
    LANE_HEIGHT: CONFIG.GAME_HEIGHT / CONFIG.LANE_COUNT,
    scale: 1,
    offsetX: 0,
    offsetY: 0
};

export const gameState = {
    score: 0,
    bestScore: parseInt(localStorage.getItem('dogsledBestScore') || '0'),
    gameSpeed: CONFIG.BASE_SPEED,
    hasStarted: false,
    isGameOver: false,
    isInvincible: false,
    invincibleTimer: 0,
    lastInvincibleMilestone: 0,
    spawnTimer: 0,
    animTime: 0,
    elapsedTime: 0,
    isPaused: false,
    pendingInput: null,
    inputBufferTimer: 0,
    hasMovedUp: false,
    hasMovedDown: false,
    tutorialTimer: 0,
    currentDogFrame: 0,
    dogAnimationTimer: 0,
    hunterFrame: 0,
    hunterFrameTimer: 0,
    isCrashing: false,
    crashShakeTimer: 0
};

export const player = {
    lane: 1,
    x: CONFIG.PLAYER_X,
    width: CONFIG.PLAYER_WIDTH,
    height: CONFIG.PLAYER_HEIGHT,
    targetLane: 1,
    laneTransitionSpeed: CONFIG.LANE_TRANSITION_SPEED,
    isTransitioning: false
};

export const obstacles = [];
export const collectibles = [];
export const obstaclePool = [];
export const collectiblePool = [];
