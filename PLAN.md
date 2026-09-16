# Game Plan: Safari Lion Quest

## Risk Tasks

### 1. Procedural 3D lion and zoo corridor
- **Why isolated:** The requested realistic lion and animal enclosures must be delivered without imported GLB assets, so the scene needs a coherent procedural silhouette, lighting, depth, and readable gameplay camera.
- **Approach:** Build a Babylon.js third-person corridor from procedural meshes, generated jungle imagery, warm directional light, fog, fences, enclosure props, simple animal silhouettes, and a procedural lion assembled from layered primitives. Keep the runner lane bounded and use a fixed follow camera.
- **Verify:** The lion remains centered and readable while moving, its four legs and tail animate during the run, fences/animals remain spatially separated, and the camera never clips into the ground or enclosure rails.

### 2. Puzzle state handoff
- **Why isolated:** Runner motion, puzzle triggers, modal UI, score rewards, and resuming the 3D loop must transition without duplicate triggers or a stuck game state.
- **Approach:** Pause the render-driven movement when the lion reaches each beacon, emit one puzzle payload to React, and expose a single `resolvePuzzle` method that marks the beacon solved, awards points/coins, and resumes the loop.
- **Verify:** Each of three puzzles opens once in order, a correct answer visibly increases score/coins, an incorrect answer gives feedback without skipping the level, and the next beacon can be reached after resuming.

## Main Build

A cinematic 30-second intro video opens the experience. Clicking **ابدأ المطاردة** transitions into a 3D zoo path. The lion auto-runs forward while the player steers with WASD or arrow keys, collects gold tokens, and reaches three increasingly difficult enclosure beacons. Each beacon opens an Arabic puzzle modal with a reward. The HUD tracks score, coins, current level, and distance.

- **Assets needed:** User-provided intro video; generated gameplay reference; generated jungle ambience image used as a distant environment card; procedural meshes for lion, fences, giraffe, elephant, tiger, puzzle beacons, tokens, and UI.
- **Verify:**
  - Intro video is visible, muted, and transitions into the game on a clear user action.
  - Movement responds to keyboard input, auto-run feels continuous, and lane boundaries prevent leaving the path.
  - Score and coins increment on token collection and puzzle completion.
  - Puzzle difficulty increases from easy pattern recognition to a multi-step logic choice.
  - HUD is readable at desktop and narrow mobile widths with no overlap.
  - No missing textures or obvious fallback materials; generated ambience is visible in the scene.
  - Gameplay is deterministic under `?demo` for screenshot verification.
  - No browser console errors during capture.
  - Reference consistency: warm golden-hour garden, red/charcoal accents, enclosure density, token trail, central beacon, and premium HUD.
  - A final checkpoint is saved after visual and type-check verification.

## Levels

1. **بوابة الزرافة — مستوى 1:** complete the sequence 2, 4, 6, ?
2. **ممر الفيل — مستوى 2:** choose the only statement that must be true from a short logic puzzle.
3. **عرين النمر — مستوى 3:** solve a three-switch timing/sequence challenge to unlock the final gate.
