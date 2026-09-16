# Structure

- `client/src/App.tsx` — Intro/video flow, game mode, HUD, puzzle modal, completion state.
- `client/src/components/GameCanvas.tsx` — Lifecycle-safe Babylon canvas wrapper; forwards engine events to React.
- `client/src/game/scene.ts` — Framework-agnostic game world, procedural zoo props, lion runner, tokens, puzzle triggers, camera and input.
- `client/src/index.css` — Premium dark/charcoal/red/gold visual system, responsive overlay, motion and accessibility styles.
- `client/index.html` — Arabic document metadata and typography preload.
- `PLAN.md` — Risk slices and verification criteria.
- `ASSETS.md` — Generated and user-provided asset manifest.
- `MEMORY.md` — Runtime discoveries and verification notes.

## Runtime contract

`createGameScene(engine, canvas, callbacks)` owns Babylon scene creation and returns a `GameHandle`. React owns only the frame and overlay; the scene owns all gameplay state. The canvas is disposed with the component and the render loop is never duplicated under StrictMode.
