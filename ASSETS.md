# Assets

**Art direction:** Cinematic golden-hour zoo garden with realistic natural foliage, dusty paths, charcoal metal fences, red-black banners, glowing amber tokens and puzzle beacons. The player-facing composition follows the supplied intro video's high-contrast red/black advertising language while grounding the playfield in a believable garden.

| Asset | Source | Storage path | Role |
|---|---|---|---|
| Intro video | User attachment | `/manus-storage/intro_22c29918.mp4` | 30-second cinematic opening before gameplay |
| Gameplay reference | Manus built-in image generation, referenced to intro frame | `/manus-storage/reference-gameplay_c393fc12.png` | Visual target and composition reference |
| Jungle ambience | Manus built-in image generation, referenced to intro frame | `/manus-storage/jungle-ambience_5b160103.jpg` | Distant garden card behind the procedural 3D playfield |
| Lion, fences, enclosures, animals, tokens, beacons | Babylon procedural meshes | N/A | Runtime geometry for a lightweight browser game |

## Generation prompts

- **Gameplay reference:** third-person in-game screenshot, realistic golden lion running down a sunlit zoo path, giraffe and elephant enclosures, amber tokens, glowing puzzle beacon, premium black/red HUD, warm late-afternoon lighting.
- **Jungle ambience:** photorealistic warm late-afternoon zoo garden, dense tropical greenery, layered canopy, dusty path, subtle red-brown and charcoal grading, no text.
