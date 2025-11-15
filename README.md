# Qimusseq Game

This repository will contain the source code for the Qimusseq Game.

## Project Overview
Qimusseq Game is a game project that will be developed and maintained in this repository. The game details, features, and development roadmap will be added as the project progresses.

## Development Plan
- The game will be developed after the initial push to GitHub.
- All updates, features, and documentation will be tracked here.

## How to Contribute
Contributions are welcome! Please check back for contribution guidelines and development updates after the initial code is pushed.

## Running and Testing
To try the game, open `index.html` in a local browser. For an optimal development experience, use a simple static server like `live-server`, `http-server` or Python's built-in server:

```bash
# Using Python 3
python -m http.server 8000

# Then open http://localhost:8000 and test on mobile (or use browser responsive tools) to see portrait-mode optimizations.
```

The canvas now adapts between landscape and portrait layouts. On phones in portrait orientation the game uses a taller logical resolution, improves touch controls (swipe/tap), and centers the HUD for better readability.

### Accessibility and Controls
- On-screen controls: For mobile users, the game now displays two circular buttons (bottom-left/up, bottom-right/down) on small screens. You can enable/disable them using `CONFIG.SHOW_ONSCREEN_CONTROLS` in `index.html`.

### Runtime Tests
- Press 'T' in the browser to execute a quick runtime test that verifies collision detection and scaling for landscape and portrait orientations. The test logs results to the console.

### iOS Safari and visualViewport
The game uses `window.visualViewport` when available to compute viewport sizes, which improves behavior on iOS Safari where the address bar can alter `innerHeight` and cause undesired layout changes. If you see layout/viewport issues, toggle the address bar by scrolling or test using `ios-simulator`/device.

---

*This README will be updated as the project evolves.*
