# Memory

- The supplied video is 1280x720, 30 seconds, and begins with a floating energy-drink can over a red/black lion-brand billboard. The game's intro uses the exact uploaded video as the opening visual, while the playable section translates its lion/red/black energy into a zoo runner.
- WebDev project is a `web-static` React/Vite app at `/home/ubuntu/safari-lion-quest`.
- Babylon.js is installed as `@babylonjs/core`.
- Large media is kept outside the project and referenced through WebDev storage paths; no media is copied into `client/public`.
- No native GLB pipeline is used. Procedural meshes keep the prototype lightweight and avoid a missing-model failure mode.
