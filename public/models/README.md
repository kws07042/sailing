Optional GLB overrides belong here:

- steamship.glb
- turtle-ship.glb
- viking-ship.glb

Procedural low-poly models are the default. Missing GLB files never cause a request or runtime error. Ship creation is isolated in `src/main.ts` so a GLTFLoader-backed factory can replace it later.
