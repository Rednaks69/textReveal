import { createBlotterMaterial } from "../core/createBlotterMaterial";

/**
 * Scrolls a directional sine wave through the text's UVs, producing a
 * continuous "rolling" ripple rather than the omnidirectional shimmer of
 * LiquidDistortMaterial. Tune with materialProps:
 *   { uAmplitude: number, uFrequency: number, uSpeed: number }
 */
export const RollingDistortMaterial = createBlotterMaterial({
  uniforms: {
    uAmplitude: { value: 0.03 },
    uFrequency: { value: 3.0 },
    uSpeed: { value: 1.2 },
  },
  mainImage: `
    uniform float uAmplitude;
    uniform float uFrequency;
    uniform float uSpeed;

    vec4 mainImage(vec2 uv, vec4 textColor) {
      float t = uTime * uSpeed;

      // Wave travels along y, displaces x — a horizontal "roll".
      float wave = sin(uv.y * uFrequency * 6.28318 + t) * uAmplitude;
      vec2 rolledUv = vec2(uv.x + wave, uv.y);

      return texture2D(uAtlas, uUvOffset + rolledUv * uUvRepeat);
    }
  `,
});
