import { describe, expect, it } from "vitest";
import { findOpenPosition, inBounds, overlaps, provisionalMetrics, sizeForOrientation } from "@/lib/geometry";
import type { BoxType, Container, Placement } from "@/types/api";

const container = { id: "c", name: "Container", length_mm: 100, width_mm: 100, height_mm: 100, max_weight_kg: 20 } as Container;
const box = { id: "b", label: "Cube", length_mm: 50, width_mm: 40, height_mm: 30, weight_kg: 2, count: 3, allow_rotation: true } as BoxType;
const placement: Placement = { box_id: "b", instance_index: 0, position_mm: { x: 0, y: 0, z: 0 }, size_mm: { length: 50, width: 40, height: 30 }, orientation: "LWH" };

describe("editor geometry", () => {
  it("maps all orientation dimensions consistently with the backend", () => {
    expect(sizeForOrientation(box, "LHW")).toEqual({ length: 50, width: 30, height: 40 });
    expect(sizeForOrientation(box, "HWL")).toEqual({ length: 30, width: 40, height: 50 });
  });

  it("uses strict AABB overlap and allows touching faces", () => {
    const touching = { ...placement, instance_index: 1, position_mm: { x: 50, y: 0, z: 0 } };
    const colliding = { ...placement, instance_index: 1, position_mm: { x: 49, y: 0, z: 0 } };
    expect(overlaps(placement, touching)).toBe(false);
    expect(overlaps(placement, colliding)).toBe(true);
  });

  it("finds a deterministic open extreme point", () => {
    const next = findOpenPosition(box, [placement], container, 10);
    expect(next).not.toBeNull();
    expect(next?.instance_index).toBe(1);
    expect(inBounds(next!, container)).toBe(true);
    expect(overlaps(placement, next!)).toBe(false);
  });

  it("computes provisional metrics without trusting the server", () => {
    const metrics = provisionalMetrics(container, [box], [placement]);
    expect(metrics.packed_count).toBe(1);
    expect(metrics.unplaced_count).toBe(2);
    expect(metrics.total_weight_kg).toBe(2);
    expect(metrics.volume_utilization_pct).toBe(6);
  });
});
