# Sea Break

> A tiny ocean escape for your browser.

Sea Break is a lightweight 3D sailing game designed for a 5–15 minute break. Sail an endless-feeling procedural ocean, switch weather instantly, discover islands, collect floating cargo, follow NPC ships, or enable autopilot and enjoy the view.

## Screenshot

A production screenshot can be placed at `docs/screenshot.webp` after the first public deployment.

## Features

- Three original procedural low-poly ships: steamship, turtle ship, and Viking ship
- Distinct configurable speed, acceleration, reverse speed, and turning
- Smooth third-person orbit camera with zoom and rear alignment
- Arcade/semi-realistic acceleration, drag, turning radius, pitch, roll, and buoyancy
- Large animated ocean surface, wake particles, spray-like boost feedback
- Seven instant weather modes with fog, rain, storm lightning, sunset, night, and stars
- Procedural streamed islands with sand, hills, rocks, trees, and occasional lighthouses
- Soft island collision response and discovery notifications
- Full-size NPC ships using the same factory and basic waypoint/avoidance steering
- Autopilot with random destinations and immediate manual override
- Floating cargo, persistent score, distance, cargo count, and island discoveries
- Canvas minimap for player, islands, and NPC ships
- Low, medium, and high graphics profiles with capped device pixel ratio
- Pause menu, sound preference, neutral Boss Key screen, and mobile advisory
- Landing, About, How to Play, Privacy, and Contact routes
- Clearly separated advertisement placeholder
- Local-only persistence through `localStorage`
- No paid assets, backend, signup, analytics, or ad network code

## Controls

| Input | Action |
| --- | --- |
| W | Accelerate |
| S | Brake / reverse |
| A / D | Turn |
| Shift | Boost |
| Mouse drag | Orbit camera |
| Mouse wheel | Zoom |
| Space | Align camera behind ship |
| P | Toggle autopilot |
| Esc | Pause |
| H | Neutral instant-pause screen |

Manual W/A/S/D input disables autopilot immediately.

## Install

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

The build output is written to `dist/`. TypeScript strict checks run as part of the build. GitHub Actions also runs the same production build on pushes and pull requests.

## Tech stack

- Vite
- TypeScript
- Three.js
- HTML/CSS overlay UI
- Canvas 2D minimap
- localStorage
- Vercel static hosting

## Deploy to Vercel

1. Import this GitHub repository in Vercel.
2. Keep the detected framework as **Vite**.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy.

`vercel.json` includes SPA rewrites and immutable caching for built assets. No environment variables or server APIs are required.

## Replacing procedural ships with GLB models

Place optional models here:

```text
public/models/steamship.glb
public/models/turtle-ship.glb
public/models/viking-ship.glb
```

The procedural ship creation is isolated in the `createShip` factory in `src/main.ts`. Add `GLTFLoader`, attempt the configured model path, and fall back to the existing procedural factory when loading fails. Preserve the root scale so player and NPC vessels remain identical in size.

The repository intentionally does not request missing GLB paths, so the default build has no model 404s.

## Adding advertising later

The current `ad-slot` markup is a visual placeholder outside the game canvas. Replace it with a dedicated provider component only after approval from the ad network.

Recommended approach:

1. Add publisher and slot IDs through Vercel environment variables.
2. Keep ads outside control/HUD regions.
3. Never label controls like ads or encourage accidental clicks.
4. Update the privacy page before enabling tracking or personalized advertising.

## Performance notes

- Device pixel ratio is capped by the selected graphics profile.
- World objects are kept in bounded arrays and recycled/repositioned or removed by distance.
- Island rocks use `InstancedMesh`.
- Rain and wake particle counts are fixed.
- The minimap uses Canvas 2D instead of a second WebGL camera.
- Distant world objects are culled by Three.js and periodically cleaned.
- Frame delta is capped to prevent simulation jumps after tab suspension.

## Current MVP limitations

- Sound is a persisted on/off-ready structure; copyrighted or uncertain audio files are intentionally not bundled.
- Procedural ocean animation focuses on vessel buoyancy, wake, reflections, and atmosphere rather than expensive FFT waves.
- NPC avoidance is lightweight steering, not full pathfinding.
- The project does not include real advertisements, accounts, multiplayer, or backend services.
- Automated browser endurance testing should be expanded after the first Vercel deployment.

## License

Source code is provided for the Sea Break project. All visual game assets are generated at runtime from original primitive geometry.
