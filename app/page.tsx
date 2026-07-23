"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import {
  BlotterProvider,
  BlotterText,
  ChannelSplitMaterial,
  LiquidDistortMaterial,
  FliesMaterial,
  RollingDistortMaterial,
  SlidingDoorMaterial,
} from "../src";

export default function Home() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <BlotterProvider>
          <BlotterText
            text="Channel"
            family="serif"
            size={240}
            fill="#171717"
            material={ChannelSplitMaterial}
            materialProps={{
              uOffset: 0.025,
              uRotation: 45,
              uApplyBlur: 0.4,
              uAnimateNoise: 1,
            }}
            position={[0, 4.8, 0]}
          />

          <BlotterText
            text="azer"
            family="sans-serif"
            weight="700"
            size={160}
            fill="#111827"
            material={LiquidDistortMaterial}
            materialProps={{ uAmplitude: 0.1, uFrequency: 5, uSpeed: 1.0 }}
            position={[0, 2.8, 0]}
          />

          <BlotterText
            text="seddik"
            family="serif"
            size={530}
            fill="#171717"
            material={FliesMaterial}
            materialProps={{
              uPointCellWidth: 0.0185,
              uPointRadius: 0.75,
              uSpeed: 2.0,
            }}
            position={[0, -0.5, 0]}
          />

          <BlotterText
            text="Rolling"
            family="sans-serif"
            weight="700"
            size={150}
            fill="#111827"
            material={RollingDistortMaterial}
            materialProps={{ uAmplitude: 0.04, uFrequency: 3, uSpeed: 1.2 }}
            position={[0, -3.4, 0]}
          />

          <BlotterText
            text="Sliding Door"
            family="serif"
            size={130}
            fill="#171717"
            material={SlidingDoorMaterial}
            materialProps={{ uStripCount: 14, uGap: 0.06, uSpeed: 1.0 }}
            position={[0, -5, 0]}
          />
        </BlotterProvider>
      </Canvas>
    </div>
  );
}
