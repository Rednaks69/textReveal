import * as THREE from "three";
import { GrowingPacker, type PackBlock } from "./GrowingPacker";

export interface TextConfig {
  text: string;
  family?: string;
  weight?: string | number;
  style?: string;
  size?: number; // px
  fill?: string;
  lineHeight?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

export interface AtlasEntry {
  id: string;
  config: TextConfig;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface AtlasUV {
  offset: [number, number];
  repeat: [number, number];
  aspect: number;
}

const DEFAULTS: Required<Pick<TextConfig, "family" | "weight" | "style" | "size" | "fill" | "lineHeight">> = {
  family: "sans-serif",
  weight: "normal",
  style: "normal",
  size: 120,
  fill: "#000000",
  lineHeight: 1.4,
};

/**
 * Owns a single canvas shared by every <BlotterText>. Registered texts are
 * measured, packed via GrowingPacker, and painted into this canvas, which
 * backs one THREE.CanvasTexture — mirroring Blotter.js's approach of
 * atlasing many texts into a single WebGL back buffer to limit draw calls.
 */
export class Atlas {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  readonly texture: THREE.CanvasTexture;
  readonly entries: Map<string, AtlasEntry> = new Map();
  private dirty = true;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 4;
    this.canvas.height = 4;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("blotter-r3f: 2D canvas context unavailable");
    this.ctx = ctx;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
  }

  register(id: string, config: TextConfig): void {
    const { width, height } = this.measure(config);
    this.entries.set(id, { id, config, width, height, x: 0, y: 0 });
    this.dirty = true;
  }

  update(id: string, config: TextConfig): void {
    const entry = this.entries.get(id);
    if (!entry) return this.register(id, config);
    const { width, height } = this.measure(config);
    entry.config = config;
    entry.width = width;
    entry.height = height;
    this.dirty = true;
  }

  unregister(id: string): void {
    if (this.entries.delete(id)) this.dirty = true;
  }

  /** Re-packs and re-paints only if something changed since the last call. */
  ensureUpToDate(): void {
    if (!this.dirty) return;
    this.repack();
    this.dirty = false;
  }

  getUV(id: string): AtlasUV | null {
    const entry = this.entries.get(id);
    if (!entry) return null;
    const w = this.canvas.width;
    const h = this.canvas.height;
    return {
      // Canvas-space Y grows downward; texture-space V grows upward.
      offset: [entry.x / w, 1 - (entry.y + entry.height) / h],
      repeat: [entry.width / w, entry.height / h],
      aspect: entry.width / entry.height,
    };
  }

  getEntry(id: string): AtlasEntry | undefined {
    return this.entries.get(id);
  }

  private fontString(config: TextConfig): string {
    const style = config.style ?? DEFAULTS.style;
    const weight = config.weight ?? DEFAULTS.weight;
    const size = config.size ?? DEFAULTS.size;
    const family = config.family ?? DEFAULTS.family;
    return `${style} ${weight} ${size}px ${family}`;
  }

  private measure(config: TextConfig): { width: number; height: number } {
    const size = config.size ?? DEFAULTS.size;
    const padLeft = config.paddingLeft ?? size * 0.15;
    const padRight = config.paddingRight ?? size * 0.15;
    const padTop = config.paddingTop ?? size * 0.3;
    const padBottom = config.paddingBottom ?? size * 0.3;

    this.ctx.font = this.fontString(config);
    const metrics = this.ctx.measureText(config.text);
    const width = Math.max(1, Math.ceil(metrics.width + padLeft + padRight));
    const height = Math.max(1, Math.ceil(size * (config.lineHeight ?? DEFAULTS.lineHeight) + padTop + padBottom));
    return { width, height };
  }

  private repack(): void {
    type Block = PackBlock & { entry: AtlasEntry };
    const blocks: Block[] = Array.from(this.entries.values())
      .sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height))
      .map((entry) => ({ w: entry.width + 2, h: entry.height + 2, entry }));

    new GrowingPacker().fit(blocks);

    let maxW = 4;
    let maxH = 4;
    for (const block of blocks) {
      if (block.fit) {
        block.entry.x = block.fit.x + 1;
        block.entry.y = block.fit.y + 1;
        maxW = Math.max(maxW, block.fit.x + block.w);
        maxH = Math.max(maxH, block.fit.y + block.h);
      }
    }

    this.canvas.width = maxW;
    this.canvas.height = maxH;
    this.paint();
  }

  private paint(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const entry of this.entries.values()) {
      const { config, x, y, height } = entry;
      const size = config.size ?? DEFAULTS.size;
      const padLeft = config.paddingLeft ?? size * 0.15;
      ctx.font = this.fontString(config);
      ctx.fillStyle = config.fill ?? DEFAULTS.fill;
      ctx.textBaseline = "middle";
      ctx.fillText(config.text, x + padLeft, y + height / 2);
    }
    this.texture.needsUpdate = true;
  }
}
