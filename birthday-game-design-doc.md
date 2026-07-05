# "Where You Are" — Birthday Game Design Document

A single-world, story-driven walking/adventure game built in Three.js, designed to feel like a real cinematic game instead of a series of mini-games stitched together.

---

## 1. The Big Idea

Instead of 5 disconnected rooms with mini-games, build **one continuous, realistic world** that tells a story. The player walks through it in third-person (this alone makes it feel 10x more "real" than FPS hands-and-gun), discovering memories, solving light environmental puzzles, and occasionally facing a real obstacle/enemy that means something — not just an HP bar to whittle down.

**Core emotional hook:** the world is literally built out of your relationship. Each zone = a real memory or inside joke, rendered as a believable place (not a floating arena). The "enemies" are metaphors (see Section 4). The ending pays off with something personal (a message, a song, a photo reveal, whatever you used before).

**Genre feel:** somewhere between *A Short Hike*, *Journey*, and *Firewatch* — walk, explore, light interaction, strong atmosphere — rather than *Doom*.

---

## 2. Story

Keep it simple and emotionally clear. Example structure (swap in your real details):

- **Setup:** She wakes up in a place that looks like a dream version of somewhere you've both been (a beach, a city street, your first date spot — pick one real memory to base the whole map on).
- **Inciting thing:** A short letter/voice line from "you" (via a companion character or floating light) explains: *"I hid pieces of us around here. Find them and I'll tell you something."*
- **Middle:** She travels through 3–4 zones, each themed around a real memory (see map). In each zone she collects one "memory fragment" (an object, photo, or glowing orb) and overcomes one obstacle.
- **Climax:** A final zone that's slightly harder / more dramatic — crossing a storm, climbing to a viewpoint, whatever fits your story.
- **Ending:** All fragments combine into a final cutscene — camera pulls back, reveals a message written by you, plays "your song," maybe shows a real photo texture-mapped onto an in-game object (e.g., a picture frame, a phone screen, a locket).

Write actual dialogue/text ahead of time — 1-2 lines per zone from a "companion" (a floating light, a small animal, or just text overlays) is enough. Don't overwrite it; sincerity beats length.

---

## 3. The Map (single connected world, not rooms)

Think of it as **one winding path** through 4-5 zones, connected by trails/bridges/doors so it never feels like "level select." Use elevation changes, curves, and sightlines (see next zone in the distance) instead of straight corridors — this alone massively improves the "realistic" feeling.

| Zone | Setting | Memory Theme (example) | Fragment | Light Obstacle |
|---|---|---|---|---|
| 1. The Beginning | A quiet dock/garden at dawn | Where you met | A glowing seashell/flower | Simple platforming / find-the-object |
| 2. The City Walk | Rain-slicked street at night, neon reflections | First date | A ticket stub / umbrella | Timing puzzle (cross before traffic/rain wave) |
| 3. The Mountain | Forest path climbing to a viewpoint | A trip you took together | A photo/locket | Stamina/climbing challenge, avoid falling rocks |
| 4. The Storm | Open field, dramatic weather | A hard time you got through together | A lantern | Survive/navigate the storm to a safe point |
| 5. The Summit/Finale | Sunset viewpoint overlooking everything | Now / the future | All fragments combine | None — just the reveal |

Design tip: build this as **one heightmap-based terrain** in Three.js with the zones as regions on it, connected by a path. Much easier to make "look real" than 5 separate boxy rooms, because natural terrain hides the lack of hand-modeled detail.

---

## 4. The Character

**Player character:** third-person, a simple stylized-realistic human model (not photoreal face — that's uncanny valley territory and very hard). Use a free rigged base model (Mixamo has free rigged characters + hundreds of free animations: walk, run, jump, climb, idle).

- Camera: over-the-shoulder third-person, slight lag/smoothing for cinematic feel (avoid instant-snap FPS camera — this reads as "cheap" fast).
- Movement: walk/run/jump/climb, maybe a "look around" free-look without moving (great for scenic moments).
- No weapon. The whole point is this isn't a shooter — she interacts with the world (pick up, push, climb) rather than fights it.

**Companion:** a small glowing orb/firefly or a floating paper lantern that follows her, gives hints, and represents "you." Cheap to make (a sphere + point light + particle trail) but reads as very intentional and warm.

---

## 5. "Enemies" — reframed as Obstacles, not combat

Since this isn't a shooter, replace monsters with **environmental antagonists** — things you avoid, outrun, or solve, not shoot:

| Old idea | New idea | Why it feels better |
|---|---|---|
| Monsters with HP bars | Moving hazards (falling rocks, rising water, wind gusts pushing her off a path) | Reads as a real obstacle in a real world, not a video-game enemy |
| Boss fight | A "storm" sequence — dynamic weather (rain, wind, lightning) she has to navigate through | Dramatic, cinematic, no combat animation work needed |
| Timer-based mini-games | Soft time pressure tied to the story (e.g. "reach the top before sunset" — sky visibly changes) | Doubles as a graphics showcase (dynamic lighting) |

If you still want one real confrontation for drama (optional), make it a single symbolic figure — a shadow/silhouette she has to walk past or a locked door she has to find a key for — not a shooting gallery.

---

## 6. Graphics Plan (realistic, achievable in Three.js)

True photorealism needs a studio pipeline, but you can get very close to "realistic" using free tools. Priority order (do these in order — each is a big visible jump):

1. **PBR materials** — use `MeshStandardMaterial` or `MeshPhysicalMaterial` with roughness/metalness/normal maps instead of flat colors. Free PBR textures: **polyhaven.com** (CC0, ready for Three.js).
2. **HDRI environment lighting** — one HDRI sky (also from Poly Haven) gives instant realistic ambient light + reflections, way better than manual point lights.
3. **Real-time shadows** — `DirectionalLight` with shadow maps, soft shadow settings (`PCFSoftShadowMap`).
4. **Post-processing stack** (via `EffectComposer`): 
   - Bloom (glow on lights/fragments)
   - SSAO (ambient occlusion — adds depth/grounding)
   - Depth of field (blurs background during dialogue/cutscene moments — huge cinematic boost)
   - Color grading / tone mapping (`ACESFilmicToneMapping` — makes lighting look like a real camera instead of flat 3D)
   - Film grain / vignette (subtle, adds "shot on camera" feel)
5. **Terrain & foliage** — displacement-mapped terrain, instanced grass/trees (use `InstancedMesh` for performance) for that lived-in outdoor look.
6. **Weather/particles** — rain (instanced particles + fog), fog for depth, dynamic sky (day/night or sunset gradient using a sky shader).
7. **Character** — Mixamo rigged model + animations, normal-mapped clothing/skin textures.

**Asset sources (free, no modeling skill needed):**
- polyhaven.com — HDRIs, PBR textures, some free models
- sketchfab.com (filter: downloadable + free + CC license) — trees, rocks, props, environment pieces
- mixamo.com — character models + animation library
- kenney.nl — good stylized props if you want a slightly softer look

---

## 7. Tech Stack

- **Three.js** (r160+) — keep this, it's the right tool
- **Cannon-es** or **Rapier** (WASM) — simple physics for collisions/falling instead of hand-written AABB code
- **GLTF/GLB** for all 3D models (industry standard, works great with Three.js loaders + Draco compression for file size)
- **Howler.js** or Web Audio API — for real ambient soundscapes + music instead of oscillator beeps (huge realism upgrade over synthesized tones)
- Optional: **React Three Fiber** if you want cleaner code organization, but plain Three.js is fine too

---

## 8. Build Plan (suggested order)

1. **Prototype gray-box** — one terrain, walk/run/jump character, third-person camera. Get movement feeling good before anything else.
2. **Lighting pass** — add HDRI + one directional light + tone mapping. This alone will make even gray boxes look "next-gen."
3. **Zone 1 art pass** — fully texture and dress one zone, get the fragment-collection loop working end to end.
4. **Post-processing** — bloom, SSAO, DOF, vignette.
5. **Repeat zones 2-4** — reuse systems (movement, collection, obstacle) with new dressing/story beats.
6. **Companion + dialogue system** — simple text popups tied to proximity triggers.
7. **Audio pass** — ambient sound per zone, music swells at key moments.
8. **Finale sequence** — cutscene camera, message reveal, song.
9. **Polish** — sound on footsteps changing per surface, subtle camera shake on wind gusts, particle details.
10. **Optimize + deploy** — compress textures, use Draco on models, test on her actual device before the birthday.

---

## 9. Scope Warning

This is meaningfully bigger than the old project. If time is short, cut to **3 zones instead of 5** and spend the saved time on lighting/post-processing polish — a shorter game that looks and feels genuinely good will land far better than a longer one that feels unfinished. Realism comes from lighting and material quality far more than from map size.

---

When you're ready to start building, I can help you write the actual Three.js code for any part of this — terrain generation, the third-person controller, the post-processing pipeline, or the dialogue/fragment system are all good starting points.
