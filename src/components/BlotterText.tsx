import React, { useEffect, useId, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useBlotterAtlas } from "./BlotterProvider";
import type { TextConfig } from "../core/Atlas";

export interface BlotterTextProps extends TextConfig {
  /** A class created by createBlotterMaterial (or one of the bundled materials). */
  material: new (params?: THREE.ShaderMaterialParameters) => THREE.ShaderMaterial;
  /** Values pushed into matching uniform names every frame (e.g. { uDistance: 8 }). */
  materialProps?: Record<string, number | THREE.Vector2 | THREE.Vector3 | THREE.Color>;
  /** World units per texture pixel. Default 0.01 (so a 120px glyph ≈ 1.2 units tall). */
  scale?: number;
  position?: [number, number, number];
}

/**
 * Renders one piece of text as a plane mesh, sampling its slice of the
 * shared atlas texture through whatever material you pass in. Multiple
 * <BlotterText> siblings under the same <BlotterProvider> are packed into
 * one atlas automatically.
 */
export function BlotterText({
  material: MaterialClass,
  materialProps,
  scale = 0.01,
  position = [0, 0, 0],
  ...config
}: BlotterTextProps) {
  const id = useId();
  const { atlas, requestUpdate } = useBlotterAtlas();
  const meshRef = useRef<THREE.Mesh>(null!);

  const material = useMemo(() => new MaterialClass(), [MaterialClass]);
  useEffect(() => () => material.dispose(), [material]);

  // Register / update this text's entry whenever its visible config changes.
  useEffect(() => {
    atlas.update(id, config);
    requestUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    config.text,
    config.family,
    config.size,
    config.weight,
    config.style,
    config.fill,
    config.lineHeight,
    config.paddingLeft,
    config.paddingRight,
    config.paddingTop,
    config.paddingBottom,
  ]);

  useEffect(
    () => () => {
      atlas.unregister(id);
      requestUpdate();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );

  useFrame((state) => {
    atlas.ensureUpToDate();
    const uv = atlas.getUV(id);
    const entry = atlas.getEntry(id);
    if (!uv || !entry) return;

    const u = material.uniforms;
    u.uAtlas.value = atlas.texture;
    (u.uUvOffset.value as THREE.Vector2).set(uv.offset[0], uv.offset[1]);
    (u.uUvRepeat.value as THREE.Vector2).set(uv.repeat[0], uv.repeat[1]);
    (u.uResolution.value as THREE.Vector2).set(entry.width, entry.height);
    u.uTime.value = state.clock.elapsedTime;

    if (materialProps) {
      for (const key of Object.keys(materialProps)) {
        if (u[key]) u[key].value = materialProps[key];
      }
    }

    if (meshRef.current) {
      meshRef.current.scale.set(entry.width * scale, entry.height * scale, 1);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
