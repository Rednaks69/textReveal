export { BlotterProvider, useBlotterAtlas } from "./components/BlotterProvider";
export { BlotterText } from "./components/BlotterText";
export type { BlotterTextProps } from "./components/BlotterText";

export { Atlas } from "./core/Atlas";
export type { TextConfig, AtlasEntry, AtlasUV } from "./core/Atlas";

export { GrowingPacker } from "./core/GrowingPacker";
export type { PackBlock } from "./core/GrowingPacker";

export { createBlotterMaterial } from "./core/createBlotterMaterial";
export type {
  CreateBlotterMaterialOptions,
  BlotterUniforms,
  BlotterMaterialClass,
} from "./core/createBlotterMaterial";

export { ChannelSplitMaterial } from "./materials/ChannelSplitMaterial";
export { LiquidDistortMaterial } from "./materials/LiquidDistortMaterial";
export { FliesMaterial } from "./materials/FliesMaterial";
export { RollingDistortMaterial } from "./materials/RollingDistortMaterial";
export { SlidingDoorMaterial } from "./materials/SlidingDoorMaterial";
