import { createBlotterMaterial } from "../core/createBlotterMaterial";

/**
 * Slices the text into vertical strips ("doors") that each slide up/down
 * on their own phase, so the glyph reads as a set of interleaved slats in
 * motion. Tune with materialProps:
 *   { uStripCount: number, uGap: number, uSpeed: number }
 */
export const SlidingDoorMaterial = createBlotterMaterial({
  uniforms: {
    uStripCount: { value: 12 },
    uGap: { value: 0.08 },
    uSpeed: { value: 1.0 },
  },
  mainImage: `
    uniform float uStripCount;
    uniform float uGap;
    uniform float uSpeed;

    float hash(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    vec4 mainImage(vec2 uv, vec4 textColor) {
      float stripIndex = floor(uv.x * uStripCount);
      float t = uTime * uSpeed;

      // Each strip gets its own phase so they don't move in lockstep.
      float phase = hash(stripIndex) * 6.28318;
      float offset = sin(t + phase) * uGap;

      vec2 slidUv = vec2(uv.x, uv.y + offset);
      return texture2D(uAtlas, uUvOffset + slidUv * uUvRepeat);
    }
  `,
});
