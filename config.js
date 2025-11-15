export const CONFIG = {
    // Display
    GAME_WIDTH: 800,
    GAME_HEIGHT: 450,
    LANE_COUNT: 3,

    // Debug
    SHOW_DEBUG: false,

    // Player
    PLAYER_X: 150,
    PLAYER_WIDTH: 120,
    PLAYER_HEIGHT: 60,
    LANE_TRANSITION_SPEED: 8,

    // Difficulty
    BASE_SPEED: 200,
    SPEED_GROWTH: 2,
    SPEED_GROWTH_TYPE: 'linear',

    // Spawning
    BASE_SPAWN_INTERVAL: 2.0,
    MIN_SPAWN_INTERVAL: 0.8,
    SPAWN_SPEED_UP: 0.01,

    // Spawn probabilities (must sum to 1.0)
    PROB_FOX: 0.15,
    PROB_SEAL: 0.20,
    PROB_BEAR: 0.20,
    PROB_ICEBERG: 0.20,
    PROB_OPENING: 0.25,

    // Collectibles
    SEAL_POINTS: 1,
    FOX_POINTS: 2,

    // Invincibility
    INVINCIBILITY_MILESTONE: 10,
    INVINCIBILITY_DURATION: 10,

    // Input buffering
    INPUT_BUFFER_TIME: 0.1,

    // Performance
    MAX_DELTA_TIME: 0.05,

    // Object pooling
    POOL_SIZE: 20,

    // First-run tutorial
    SHOW_HINTS: true,
    HINT_DURATION: 5.0,

    PORTRAIT_GAME_WIDTH: 480,
    PORTRAIT_GAME_HEIGHT: 800,
    PORTRAIT_PLAYER_X: 80,
    PORTRAIT_PLAYER_WIDTH: undefined,
    PORTRAIT_PLAYER_HEIGHT: undefined,

    PORTRAIT_LANE_PADDING: 0.18,
    PORTRAIT_DOG_SCALE: 0.9,
    PORTRAIT_OBSTACLE_SCALE: 0.9,

    SHOW_ONSCREEN_CONTROLS: true
};
