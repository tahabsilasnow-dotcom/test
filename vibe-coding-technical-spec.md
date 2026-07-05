# TECHNICAL BUILD SPEC — Read This Entire Document Before Writing Any Code

Instructions for the AI coding agent building this project. This is not a vague brief — follow the exact values, structure, and steps below. Do not simplify the controls, lighting, or post-processing "for now" — these ARE the core requirements, not polish to add later. If something here isn't clear, ask before guessing.

**Context: a previous attempt at this game failed because of three specific problems: (1) controls felt bad, (2) graphics looked flat/cheap, (3) there was no actual gameplay/objectives, just empty rooms. Every section below exists specifically to prevent one of those three failures. Do not skip the reference-repo step — clone and actually read the code before writing your own controller from scratch.**

---

## 0. Before writing a single line: clone these reference repos

Do not build the character controller or renderer setup from memory/guesswork. Clone these into a `/reference` folder (gitignored, never shipped), read the actual source, and adapt the patterns — this is how you avoid the jittery/broken controls from last time.

```bash
mkdir reference && cd reference

# Third-person character controller with a finite state machine
# (idle/walk/run/jump transitions) — this solves the "controls feel bad" problem directly
git clone https://github.com/simondevyoutube/ThreeJS_Tutorial_CharacterController.git

# Basic world/terrain/lighting setup from the same author, good baseline scene structure
git clone https://github.com/simondevyoutube/ThreeJS_Tutorial_BasicWorld.git

# Third-person controller + Cannon.js physics integration reference
git clone https://github.com/matthias-schuetz/THREE-BasicThirdPersonGame.git

# The official three.js repo — use examples/ folder as ground truth for postprocessing,
# shadows, and materials. Do NOT hand-roll postprocessing passes from memory.
git clone --depth 1 https://github.com/mrdoob/three.js.git
# Specifically read: three.js/examples/webgl_postprocessing_*.html
# and: three.js/examples/jsm/postprocessing/*.js
```

Read `ThreeJS_Tutorial_CharacterController` first — its `_CharacterController` and `_FiniteStateMachine` classes are the actual solution to "controls are not good." Copy the structure (state machine per animation state: idle → walk → run → jump), not just the numbers.

---

## 1. Project structure

```
/src
  /core
    Engine.js          — scene, renderer, camera, render loop only. No game logic here.
    InputManager.js     — keyboard/mouse state, exposes .keys, .mouseDelta
    AssetLoader.js       — GLTFLoader + DRACOLoader + RGBELoader wrapper, loading screen hooks
  /player
    CharacterController.js  — state machine (see section 2)
    ThirdPersonCamera.js     — camera rig (see section 2)
  /world
    Terrain.js
    Zone1_Dock.js
    Zone2_CityStreet.js
    Zone3_Mountain.js
    Zone4_Storm.js
    Zone5_Summit.js
  /systems
    ObjectiveSystem.js   — tracks fragment collection state per zone (see section 4)
    DialogueSystem.js    — proximity-triggered text popups
    AudioManager.js      — Howler.js wrapper, ambient + sfx + music layers
  /rendering
    PostProcessing.js    — EffectComposer setup (see section 3)
    Lighting.js          — HDRI + sun + shadow config
  main.js
/public
  /models   (.glb files)
  /hdri     (.hdr files)
  /audio
/reference  (cloned repos, gitignored)
```

---

## 2. Controls — exact spec (fixes "controls are not good")

### Input
- WASD relative to camera yaw (not world axes) — pressing W always moves the character away from the camera, regardless of camera angle.
- Shift = sprint. Space = jump. No mouse-look drag on left-click; use right-click-drag OR a dedicated "look" mode, since third-person games shouldn't require holding the mouse button just to look around. Alternative: pointer lock only when explicitly toggled by a key (e.g. `C`), otherwise camera stays behind character automatically.

### Character Controller state machine (implement literally as a finite state machine, not if/else chains)
States: `idle`, `walk`, `run`, `jumpUp`, `jumpFall`, `land`.
- Transitions must crossfade animations over 0.2–0.3s using `AnimationMixer` — hard animation cuts are what made the old controls feel bad.
- Movement values:
  - Walk speed: 2.2 m/s
  - Run speed: 5.5 m/s
  - Acceleration/deceleration: lerp current velocity toward target velocity at factor 8–10 per second (NOT instant velocity set — this is what causes "floaty" or "snappy" bad-feeling movement)
  - Turn speed: character rotates toward movement direction at ~10 rad/s lerp, not instant snap
  - Gravity: -18 m/s²
  - Jump velocity: 7 m/s
  - Coyote time: 0.12s (allow jump slightly after leaving a ledge — this alone massively improves game feel)
  - Jump buffering: 0.15s (if jump pressed slightly before landing, execute on land)

### Camera rig (`ThirdPersonCamera.js`)
- Spring-arm style: camera targets a position offset behind+above the character, SmoothDamped (not snapped) toward that target every frame.
- Default offset: 4.5 units behind, 2 units up, looking at a point 1.5 units above character origin (chest height, not feet).
- Collision: raycast from character to desired camera position; if blocked, pull camera in front of the obstruction (prevents camera clipping through walls — a very noticeable "cheap game" tell if missing).
- Mouse movement orbits the camera around the character (yaw + limited pitch, clamp pitch to roughly -30° to +60°), independent of character facing direction, matching modern third-person games (character doesn't have to face where camera looks).

### Physics/collision
- Use `cannon-es` (`npm install cannon-es`) for the player capsule collider against a static terrain/mesh trimesh, instead of hand-rolled AABB checks. This is more robust than the old AABB system and handles slopes properly.

---

## 3. Graphics pipeline — exact spec (fixes "graphics not good")

### Renderer setup
```js
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```
Missing `ACESFilmicToneMapping` is one of the most common reasons a Three.js scene looks "flat/game-asset-y" instead of realistic. Do not skip this.

### Lighting
- One `HemisphereLight` (sky/ground color) at low intensity for ambient fill.
- One `DirectionalLight` as the sun: `castShadow = true`, shadow map size 2048×2048 minimum, shadow camera frustum tightly fit to the current zone (not the whole map) to keep shadows sharp.
- Load an HDRI via `RGBELoader` + `PMREMGenerator`, set as `scene.environment` (not just background) — this is what gives PBR materials realistic reflections/ambient light instead of looking matte and fake. Source HDRIs from https://polyhaven.com/hdris (free, CC0, direct download, no login).

### Materials
- Every surface uses `MeshStandardMaterial` or `MeshPhysicalMaterial` with actual roughness + normal maps, not flat colors with a basic material. Get free PBR texture sets (already packaged as albedo/normal/roughness) from https://polyhaven.com/textures.
- Water/glass/lantern-glow surfaces: `MeshPhysicalMaterial` with `transmission` or `emissive` as appropriate.

### Post-processing (`EffectComposer`, chain in this order)
1. `RenderPass`
2. `SSAOPass` or `N8AOPass` — adds contact shadows/depth, biggest single "why does this look more real" upgrade after tone mapping
3. `UnrealBloomPass` — for the companion light, lanterns, magical fragments only (use a bloom layer/selective bloom, not global, or everything will glow)
4. `BokehPass` / depth of field — engage during dialogue/cutscene moments (subtle background blur), not during normal movement (would hurt playability)
5. Vignette + subtle film grain (custom `ShaderPass`) — small amount, this sells "shot on camera" over "rendered in a browser"
6. `OutputPass` last

Reference the actual passes in `three.js/examples/jsm/postprocessing/` from the cloned repo rather than writing shader code from memory.

### Environment detail
- Terrain: `PlaneGeometry` with a displacement/height map, or a heightfield-based mesh, not a flat plane — flat ground reads as "unfinished level" immediately.
- Foliage: use `THREE.InstancedMesh` for grass/trees/rocks (thousands of instances at negligible cost) — get free tree/rock/grass `.glb` models from https://sketchfab.com (filter: Downloadable + Free, license CC or CC0) or Poly Haven's model section.
- Fog: `scene.fog = new THREE.FogExp2(color, density)` per zone, tuned per mood (thin dawn haze in zone 1, heavier fog/rain in zone 4).
- Skybox: dynamic sky shader (three.js has a `Sky.js` example in `examples/jsm/objects/Sky.js`) rather than a static skybox texture, so the sun position and color can shift as she progresses (dawn → day → storm → sunset) for a strong "time is passing" cinematic feel.

### Character model
- Get a rigged humanoid + full animation set from https://www.mixamo.com (free, requires only an Adobe login): download T-pose model as `.glb`/`.fbx`, and separately download idle/walk/run/jump-start/jump-loop/jump-land animations "in place," then combine all animation clips onto one skeleton in a GLTF-conversion step (or use `mixamo.com`'s built-in "download with skin" for the base + skinless FBX for extra animations, then merge with a script — this is a known workflow, search "mixamo three.js multiple animations" if the coder needs the merge script).

---

## 4. Actual gameplay per zone (fixes "no games I find")

Every zone needs a clear, testable objective and win/lose state — do not leave any zone as just a walkable space with nothing to do.

| Zone | Objective (explicit) | Fail state | Completion trigger |
|---|---|---|---|
| 1. Dock (dawn) | Walk the dock, find and interact with 3 glowing objects hidden in specific spots (proximity + "E to interact" prompt) | None (tutorial zone, no fail state) | All 3 collected → dialogue + fragment 1 awarded |
| 2. City Street (rain, night) | Cross 4 street sections; each has a scripted hazard (car headlight sweep you must dodge by timing a dash, or a scaffolding piece that falls at a fixed interval) | Get hit 3 times → respawn at last checkpoint (no permadeath, no "game over" screen — this is a low-stress birthday game) | Reach the end of the street → fragment 2 |
| 3. Mountain | Platforming climb: jump between ledges, one wind-gust zone that pushes the character sideways (requires timing/counter-movement), reach the summit marker | Fall off path → respawn at last checkpoint | Reach summit marker → fragment 3 |
| 4. Storm (open field) | Navigate to 3 lantern checkpoints while dodging falling-branch hazards and a moving "whiteout" fog wall that obscures vision if you're too slow | Caught by whiteout 3 times → respawn at last lantern | All 3 lanterns lit → fragment 4 |
| 5. Summit (finale) | No objective — walk to the viewpoint, trigger cutscene | None | Automatic |

Implement `ObjectiveSystem.js` as a simple state machine per zone: `{zoneId, requiredCount, currentCount, completed}`, with a UI element (progress text or icon row, top of screen) so the player always knows what to do — the old game's problem was the player couldn't tell what the objective even was.

Add a **quest marker / soft guidance system**: a subtle glowing particle trail or the companion firefly actively flies toward the next objective when the player is idle for >5 seconds, so nobody gets lost with no idea what to do (common failure mode in homemade games).

---

## 5. Asset checklist (all free, no purchases required)

| Need | Source | Notes |
|---|---|---|
| Character model + animations | mixamo.com | Free Adobe account, download as FBX, convert to GLTF with `gltf-pipeline` or a Blender import/export pass |
| HDRIs (sky/lighting) | polyhaven.com/hdris | Pick one per zone mood (clear dawn, overcast night, sunset) |
| PBR ground/rock/wood textures | polyhaven.com/textures | Download 2K resolution, not 8K, for performance |
| Trees, rocks, props, streetlights, umbrellas | sketchfab.com (filter Downloadable+Free) | Check license per model before using |
| Rain/particle reference shaders | three.js examples repo, `examples/webgl_*rain*` or particle examples | Adapt, don't copy verbatim |
| Ambient/music audio | freesound.org (CC0 filter) or your own "your song" file | Use Howler.js to layer ambient + music + sfx independently with separate volume controls |

---

## 6. Build order (do not reorder — each step depends on the last)

1. Clone reference repos (Section 0). Read the character controller source fully before writing code.
2. `Engine.js` + renderer config from Section 3 (tone mapping, shadow map) — verify a single test cube looks "correct" (soft shadow, correct color space) before building anything else.
3. `CharacterController.js` + `ThirdPersonCamera.js` on a flat gray-box plane. Get this feeling good — smooth acceleration, camera collision, coyote time — before adding a single art asset. This is the step that was skipped/rushed last time.
4. `Lighting.js` — HDRI + sun + fog for Zone 1 only.
5. Build Zone 1 fully: terrain, props, 3 interactables, dialogue trigger, fragment award. Playtest it start to finish.
6. `PostProcessing.js` — add the full pass chain, tune bloom/SSAO/vignette strength against Zone 1.
7. Repeat steps 4–5 for Zones 2–4, reusing all systems.
8. Build Zone 5 (finale) — cutscene camera path (simple keyframed camera move), reveal UI, music swell.
9. `AudioManager.js` — ambient per zone, footstep sounds tied to animation state + ground material, music layering.
10. `ObjectiveSystem.js` + on-screen progress UI + guidance system (Section 4) — verify a first-time player with zero explanation can complete each zone.
11. Playtest on the actual device it'll be shown on (laptop/phone) and check frame rate; reduce shadow map size / instance counts / texture resolution as needed before optimizing anything else.
12. Deploy (Vercel, same as before).

---

## 7. Definition of done for each zone (use this as a checklist, don't mark a zone finished without it)

- [ ] Player can clearly tell what the objective is within 5 seconds of entering
- [ ] There is a fail state that doesn't punish harshly (respawn, not game over screen)
- [ ] At least one moving/dynamic hazard, not just static geometry to walk past
- [ ] Lighting uses the HDRI + sun setup, not default flat ambient light
- [ ] At least 3 distinct real-world-sourced assets (not primitive boxes/spheres) dressing the space
- [ ] Camera never clips through geometry when moving normally through the zone
- [ ] Completing the zone gives clear feedback (sound + visual + UI update), not a silent state change
