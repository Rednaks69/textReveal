/**
 * A "growing" rectangle bin-packer. Packs a list of {w, h} blocks as tightly
 * as possible into a single, expanding 2D area, starting from the first
 * block and growing right or down as needed to fit the rest.
 *
 * This is the same general algorithm family the original Blotter.js used
 * for atlasing multiple texts into one WebGL texture (bin-packing, in the
 * spirit of jakesgordon/bin-packing), reimplemented here in TypeScript.
 */

export interface PackBlock {
  w: number;
  h: number;
  fit?: PackNode;
}

interface PackNode {
  x: number;
  y: number;
  w: number;
  h: number;
  used?: boolean;
  down?: PackNode;
  right?: PackNode;
}

export class GrowingPacker {
  private root: PackNode = { x: 0, y: 0, w: 0, h: 0 };

  fit(blocks: PackBlock[]): void {
    const first = blocks[0];
    this.root = { x: 0, y: 0, w: first ? first.w : 0, h: first ? first.h : 0 };

    for (const block of blocks) {
      const node = this.findNode(this.root, block.w, block.h);
      block.fit = node
        ? this.splitNode(node, block.w, block.h)
        : this.growNode(block.w, block.h) ?? undefined;
    }
  }

  private findNode(root: PackNode, w: number, h: number): PackNode | null {
    if (root.used) {
      return (
        this.findNode(root.right as PackNode, w, h) ||
        this.findNode(root.down as PackNode, w, h)
      );
    }
    if (w <= root.w && h <= root.h) return root;
    return null;
  }

  private splitNode(node: PackNode, w: number, h: number): PackNode {
    node.used = true;
    node.down = { x: node.x, y: node.y + h, w: node.w, h: node.h - h };
    node.right = { x: node.x + w, y: node.y, w: node.w - w, h };
    return node;
  }

  private growNode(w: number, h: number): PackNode | null {
    const canGrowDown = w <= this.root.w;
    const canGrowRight = h <= this.root.h;

    // Prefer whichever growth direction keeps the atlas closer to square.
    const shouldGrowRight = canGrowRight && this.root.h >= this.root.w + w;
    const shouldGrowDown = canGrowDown && this.root.w >= this.root.h + h;

    if (shouldGrowRight) return this.growRight(w, h);
    if (shouldGrowDown) return this.growDown(w, h);
    if (canGrowRight) return this.growRight(w, h);
    if (canGrowDown) return this.growDown(w, h);
    return null;
  }

  private growRight(w: number, h: number): PackNode | null {
    this.root = {
      used: true,
      x: 0,
      y: 0,
      w: this.root.w + w,
      h: this.root.h,
      down: this.root,
      right: { x: this.root.w, y: 0, w, h: this.root.h },
    };
    const node = this.findNode(this.root, w, h);
    return node ? this.splitNode(node, w, h) : null;
  }

  private growDown(w: number, h: number): PackNode | null {
    this.root = {
      used: true,
      x: 0,
      y: 0,
      w: this.root.w,
      h: this.root.h + h,
      down: { x: 0, y: this.root.h, w: this.root.w, h },
      right: this.root,
    };
    const node = this.findNode(this.root, w, h);
    return node ? this.splitNode(node, w, h) : null;
  }
}
