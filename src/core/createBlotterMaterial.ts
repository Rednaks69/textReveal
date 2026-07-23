import * as THREE from "three";

export type BlotterUniforms = Record<string, THREE.IUniform>;

export interface CreateBlotterMaterialOptions {
  /** Extra uniforms your mainImage body needs, beyond the built-in ones. */
  uniforms?: BlotterUniforms;
  /** Override the default passthrough vertex shader if you need one. */
  vertexShader?: string;
  /**
   * GLSL source defining `vec4 mainImage(vec2 uv, vec4 textColor)`.
   * `uv` is 0..1 across this text's own quad (not the shared atlas).
   * `textColor` is the atlas sample already looked up for you at `uv`.
   * Built-ins available here: uAtlas, uUvOffset, uUvRepeat, uResolution, uTime.
   *
   * This mirrors Blotter.js's custom-material pattern: you author the pixel
   * function, the boilerplate (atlas sampling, uniforms, varyings) is supplied.
   */
  mainImage: string;
  defines?: Record<string, string | number>;
}

const DEFAULT_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Builds a THREE.ShaderMaterial subclass ready to drop into a <BlotterText>.
 * Analogous to authoring a new Blotter Material: you provide a fragment
 * "mainImage" function, this wires it into a working shader program.
 */
export function createBlotterMaterial(options: CreateBlotterMaterialOptions) {
  const { uniforms = {}, vertexShader = DEFAULT_VERTEX_SHADER, mainImage, defines } = options;

  const baseUniforms: BlotterUniforms = {
    uTime: { value: 0 },
    uAtlas: { value: null },
    uUvOffset: { value: new THREE.Vector2(0, 0) },
    uUvRepeat: { value: new THREE.Vector2(1, 1) },
    uResolution: { value: new THREE.Vector2(1, 1) },
    ...uniforms,
  };

  const fragmentShader = `
    uniform sampler2D uAtlas;
    uniform vec2 uUvOffset;
    uniform vec2 uUvRepeat;
    uniform vec2 uResolution;
    uniform float uTime;
    varying vec2 vUv;

    ${mainImage}

    void main() {
      vec2 atlasUv = uUvOffset + vUv * uUvRepeat;
      vec4 textColor = texture2D(uAtlas, atlasUv);
      gl_FragColor = mainImage(vUv, textColor);
    }
  `;

  return class BlotterShaderMaterial extends THREE.ShaderMaterial {
    constructor(params?: THREE.ShaderMaterialParameters) {
      super({
        uniforms: THREE.UniformsUtils.clone(baseUniforms as Record<string, THREE.IUniform>),
        vertexShader,
        fragmentShader,
        transparent: true,
        defines,
        ...params,
      });
    }
  };
}

export type BlotterMaterialClass = ReturnType<typeof createBlotterMaterial>;
