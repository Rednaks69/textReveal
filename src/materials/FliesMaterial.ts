import { createBlotterMaterial } from "../core/createBlotterMaterial";

/**
 * NOTE: Unlike ChannelSplitMaterial/LiquidDistortMaterial, I was not able to
 * retrieve upstream Blotter's actual fliesMaterial.js source for a verified
 * port — this is a from-scratch approximation tuned against a screenshot of
 * https://blotter.js.org/#/materials/FliesMaterial. If you can get the real
 * build/materials/fliesMaterial.js file (e.g. `npm view blotter.js` or
 * cloning the repo directly), paste it in and I'll do a proper 1:1 port.
 *
 * Scatters organically-placed, varied-size dots across the glyph — a
 * stipple/pointillism look rather than a visible grid — each jittering
 * gently, plus an optional cursor "dodge". Tune with materialProps:
 *   { uPointCellWidth: number, uPointRadius: number, uSpeed: number,
 *     uDodge: number (0/1), uDodgePosition: THREE.Vector2, uDodgeSpread: number }
 */
export const FliesMaterial = createBlotterMaterial({
  uniforms: {
    uPointCellWidth: { value: 0.018 },
    uPointRadius: { value: 0.5 },
    uSpeed: { value: 1.0 },
    uDodge: { value: 0 },
    uDodgePosition: { value: [0.5, 0.5] },
    uDodgeSpread: { value: 0.15 },
  },
  mainImage: `
    uniform float uPointCellWidth;
    uniform float uPointRadius;
    uniform float uSpeed;
    uniform float uDodge;
    uniform vec2 uDodgePosition;
    uniform float uDodgeSpread;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    vec4 mainImage(vec2 uv, vec4 textColor) {
      vec2 cell = floor(uv / uPointCellWidth);
      vec2 cellUv = fract(uv / uPointCellWidth);

      float t = uTime * uSpeed;
      vec4 result = vec4(textColor.rgb, 0.0);

      // Check this cell and its neighbors so dots aren't clipped at cell
      // boundaries and can overlap — that overlap is what breaks up the
      // grid look into an organic scatter.
      for (int ox = -1; ox <= 1; ox++) {
        for (int oy = -1; oy <= 1; oy++) {
          vec2 neighborCell = cell + vec2(float(ox), float(oy));

          // Fully randomized anchor within the cell (not just jitter around
          // its center) — this is what removes the visible grid structure.
          vec2 anchor = vec2(hash(neighborCell), hash(neighborCell + 5.2));

          // Independent per-dot size so the scatter reads as varied,
          // organic points rather than uniform grid dots.
          float sizeRand = 0.5 + hash(neighborCell + 9.1) * 1.0;
          float radius = uPointRadius * sizeRand * 0.5;

          // Circular/looping buzz motion (different x/y frequencies so it
          // doesn't just oscillate back and forth on one axis) — amplitude
          // is a healthy fraction of the cell so it's actually visible.
          vec2 jitterDir = vec2(hash(neighborCell + 2.3), hash(neighborCell + 7.7)) - 0.5;
          float phase = hash(neighborCell + 3.9) * 6.2831;
          vec2 buzz = vec2(
            sin(t * 1.3 + phase),
            cos(t * 1.7 + phase * 1.9)
          ) * 0.4;
          vec2 jitteredAnchor = anchor + (jitterDir * 0.3 + buzz * 0.5);

          vec2 localUv = cellUv - vec2(float(ox), float(oy));
          float dist = distance(localUv, jitteredAnchor);
          float mask = smoothstep(radius, radius * 0.6, dist);

          if (mask <= 0.0) continue;

          // Only draw where the underlying glyph actually has ink near
          // this dot's anchor, so dots trace the letterform.
          vec2 sampleUv = (neighborCell + jitteredAnchor) * uPointCellWidth;
          vec4 glyphSample = texture2D(uAtlas, uUvOffset + sampleUv * uUvRepeat);

          float dodgeAmt = 0.0;
          if (uDodge > 0.5) {
            float d = distance(uv, uDodgePosition);
            dodgeAmt = smoothstep(uDodgeSpread, 0.0, d);
          }

          float a = mask * glyphSample.a * (1.0 - dodgeAmt);
          result.a = max(result.a, a);
        }
      }

      return result;
    }
  `,
});
