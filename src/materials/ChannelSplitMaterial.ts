import { createBlotterMaterial } from "../core/createBlotterMaterial";

/**
 * Offsets the red/blue channels along a fixed direction and motion-blurs
 * each by averaging multiple samples along that direction — this is what
 * gives upstream Blotter's ChannelSplitMaterial its smeared "old CRT" look,
 * as opposed to three crisp hard-edged copies. Direction is static (set it
 * yourself, or drive it from mouse position) — it does not auto-rotate.
 *
 * Important: samples are blended against `uBlendColor` before the channels
 * are split. Outside the glyph the atlas is transparent black (0,0,0,0),
 * which is barely distinguishable from dark text colors — with no real
 * color contrast at the edge, splitting the channels produces a muddy
 * monochrome blur instead of a colored fringe. Blending against a solid
 * background color first gives edges an actual RGB gradient to split.
 * Set `uBlendColor` to match whatever your text sits on (defaults to
 * opaque white).
 *
 * Tune with materialProps:
 *   { uOffset: number (0..~0.5), uRotation: number (degrees),
 *     uApplyBlur: number (0/1), uAnimateNoise: number (0..1),
 *     uBlendColor: THREE.Vector4 (rgba, 0..1) }
 */
export const ChannelSplitMaterial = createBlotterMaterial({
  uniforms: {
    uOffset: { value: 0.05 },
    uRotation: { value: 45 },
    uApplyBlur: { value: 1 },
    uAnimateNoise: { value: 1 },
    uBlendColor: { value: [1, 1, 1, 1] },
  },
  mainImage: `
    uniform float uOffset;
    uniform float uRotation;
    uniform float uApplyBlur;
    uniform float uAnimateNoise;
    uniform vec4 uBlendColor;

    const int BLUR_STEPS = 10;

    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec2 dirForDegrees(float deg) {
      float rad = radians(deg);
      return vec2(cos(rad), sin(rad));
    }

    // Sample the atlas, then blend toward uBlendColor by (1 - alpha) so
    // transparent/edge pixels get real background color instead of (0,0,0).
    vec4 blendedTexture(vec2 uv) {
      vec4 c = texture2D(uAtlas, uUvOffset + uv * uUvRepeat);
      vec3 blended = mix(uBlendColor.rgb, c.rgb, c.a);
      return vec4(blended, c.a);
    }

    // Averages several samples between the origin uv and uv + offset,
    // producing a directional smear rather than one crisp copy.
    vec4 motionBlurSample(vec2 uv, vec2 offsetPx) {
      vec4 total = vec4(0.0);
      for (int i = 0; i < BLUR_STEPS; i++) {
        float t = float(i) / float(BLUR_STEPS - 1);
        vec2 stepUv = uv + (offsetPx * (t - 0.5)) / uResolution;
        total += blendedTexture(stepUv);
      }
      return total / float(BLUR_STEPS);
    }

    vec4 mainImage(vec2 uv, vec4 textColor) {
      vec2 dir = dirForDegrees(uRotation);
      float offsetPxLen = uOffset * uResolution.y;
      vec2 offsetPx = dir * offsetPxLen;

      vec4 rSample;
      vec4 gSample = blendedTexture(uv);
      vec4 bSample;

      if (uApplyBlur > 0.5) {
        rSample = motionBlurSample(uv + offsetPx / uResolution, offsetPx);
        bSample = motionBlurSample(uv - offsetPx / uResolution, offsetPx);
      } else {
        rSample = blendedTexture(uv + offsetPx / uResolution);
        bSample = blendedTexture(uv - offsetPx / uResolution);
      }

      float a = max(textColor.a, max(rSample.a, max(gSample.a, bSample.a)));

      if (uAnimateNoise > 0.0) {
        float n = rand(uv * 300.0 + uTime) * uAnimateNoise;
        a -= n * (1.0 - a) * 0.2;
      }

      return vec4(rSample.r, gSample.g, bSample.b, a);
    }
  `,
});
