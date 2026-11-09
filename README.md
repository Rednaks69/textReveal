

https://github.com/user-attachments/assets/efaebec4-00f8-41e0-9079-941dfba449b5

# textReveal

**Goal:** A TypeScript library of GLSL-backed text effects for [react-three-fiber](https://github.com/pmndrs/react-three-fiber). It turns plain HTML-like text into animated, shader-driven 3D meshes inside an R3F scene.

## What it does

textReveal lets you render text as interactive 3D plane meshes and apply GPU-driven visual effects to them. Each piece of text is registered, measured, packed into a single shared texture atlas, and rendered through a custom GLSL shader — so a wall of text stays cheap to draw (one draw call per material) even as the text changes, animates, or warps in real time.

## Core architecture

- **Shared atlas texture.** Every `<BlotterText>` under one `<BlotterProvider>` is measured, packed into a single canvas via a **GrowingPacker** bin-packer, and painted into one `THREE.CanvasTexture`. Packing matters: glyphs of different sizes get arranged efficiently so the atlas stays tight, and the whole set is backed by a single texture rather than scattered draw calls.
- **`createBlotterMaterial` factory.** You author a GLSL `mainImage(uv, textColor)` pixel function; the factory turns it into a `THREE.ShaderMaterial` with the built-in uniforms (`uAtlas`, `uUvOffset`, `uUvRepeat`, `uResolution`, `uTime`) and the atlas-sampling boilerplate already wired up. The pixel author only writes the visual effect; the framework handles atlas lookup.
- **`BlotterText` component.** One text = one plane mesh sampling its slice of the shared atlas through whatever material class is passed in. Its `useFrame` effect updates the atlas, feeds the material's uniforms (animation, distance, amplitude, etc.), and rescales the mesh to match the glyph's measured size.
- **`BlotterProvider` / `useBlotterAtlas`.** Context that owns the shared `Atlas` instance and the dirty-flag update trigger, so changes to any text under the provider propagate automatically.

## How it works (and why it's structured this way)

Text is rendered to a 2D canvas, packed into one shared texture, then used as a GPU texture sampled inside a shader. This keeps the heavy rasterization work (font measurement, glyph drawing, atlas packing) in CPU-friendly canvas code, while the per-frame distortion, color-shift, or glow work happens entirely on the GPU. The `uUvOffset`, `uUvRepeat`, and `uResolution` uniforms are what let one shader handle text of any size, position, and rotation inside the atlas.

## Bundled materials

- **ChannelSplitMaterial** — orbits the RGB channels for a chromatic-aberration / glitch look (`uDistance`, `uSpeed`).
- **LiquidDistortMaterial** — noise-based animated UV warp for a liquid / heat-shimmer look (`uAmplitude`, `uFrequency`, `uSpeed`).

## Example

```tsx
import { Canvas } from "@react-three/fiber";
import { BlotterProvider, BlotterText, ChannelSplitMaterial } from "textReveal";

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <BlotterProvider>
        <BlotterText
          text="Hello"
          family="serif"
          size={120}
          fill="#171717"
          material={ChannelSplitMaterial}
          materialProps={{ uDistance: 10, uSpeed: 0.5 }}
          position={[0, 0.8, 0]}
        />
      </BlotterProvider>
    </Canvas>
  );
}
```

## Project layout

```
src/
  core/
    Atlas.ts                 measures, packs, paints text into one canvas/texture
    GrowingPacker.ts         bin-packing algorithm for the shared atlas
    createBlotterMaterial.ts factory: mainImage GLSL -> ShaderMaterial class
  components/
    BlotterProvider.tsx      context holding the shared Atlas
    BlotterText.tsx          registers text, renders its mesh
  materials/
    ChannelSplitMaterial.ts
    LiquidDistortMaterial.ts
  index.ts                   public API barrel
example/App.tsx              two-text demo: ChannelSplit + LiquidDistort
```

## Distribution

Builds `dist/` (ESM + CJS + `.d.ts`) via tsup, typed as an npm package with peer dependencies on `@react-three/fiber`, `react`, `react-dom`, and `three`.

## Repository

https://github.com/Rednaks69/textReveal
