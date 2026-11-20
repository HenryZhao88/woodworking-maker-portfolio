import { describe, it, expect } from "vitest";
import { squareToQuad, applyHomography, type Quad } from "@/lib/homography";

const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));

describe("squareToQuad", () => {
  it("maps unit square corners onto an axis-aligned rect", () => {
    const q: Quad = [[10, 20], [110, 20], [110, 70], [10, 70]]; // (0,0) (1,0) (1,1) (0,1)
    const H = squareToQuad(q);
    close(applyHomography(H, 0, 0), [10, 20]);
    close(applyHomography(H, 1, 1), [110, 70]);
    close(applyHomography(H, 0.5, 0.5), [60, 45]);
  });

  it("maps corners of a perspective quad exactly", () => {
    const q: Quad = [[0, 0], [100, 10], [90, 80], [5, 100]];
    const H = squareToQuad(q);
    close(applyHomography(H, 0, 0), q[0]);
    close(applyHomography(H, 1, 0), q[1]);
    close(applyHomography(H, 1, 1), q[2]);
    close(applyHomography(H, 0, 1), q[3]);
  });

  it("is perspective-correct: center maps to diagonal intersection", () => {
    const q: Quad = [[0, 0], [100, 20], [100, 80], [0, 100]];
    const [x, y] = applyHomography(squareToQuad(q), 0.5, 0.5);
    // diagonals (0,0)-(100,80) and (100,20)-(0,100) intersect at y=0.8x and y=100-0.8x → (62.5, 50)
    expect(x).toBeCloseTo(62.5, 4);
    expect(y).toBeCloseTo(50, 4);
  });
});
