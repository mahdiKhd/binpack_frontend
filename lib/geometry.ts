import type { BoxType, Container, Metrics, Orientation, Placement } from "@/types/api";

export const ORIENTATIONS: Orientation[] = ["LWH", "LHW", "WLH", "WHL", "HLW", "HWL"];

export function sizeForOrientation(box: BoxType, orientation: Orientation) {
  const values = { L: box.length_mm, W: box.width_mm, H: box.height_mm };
  return {
    length: values[orientation[0] as keyof typeof values],
    width: values[orientation[1] as keyof typeof values],
    height: values[orientation[2] as keyof typeof values],
  };
}

export function overlaps(first: Placement, second: Placement) {
  const a = first.position_mm;
  const as = first.size_mm;
  const b = second.position_mm;
  const bs = second.size_mm;
  return (
    a.x < b.x + bs.length &&
    a.x + as.length > b.x &&
    a.y < b.y + bs.width &&
    a.y + as.width > b.y &&
    a.z < b.z + bs.height &&
    a.z + as.height > b.z
  );
}

export function inBounds(placement: Placement, container: Container) {
  const p = placement.position_mm;
  const s = placement.size_mm;
  return (
    p.x >= 0 &&
    p.y >= 0 &&
    p.z >= 0 &&
    p.x + s.length <= container.length_mm &&
    p.y + s.width <= container.width_mm &&
    p.z + s.height <= container.height_mm
  );
}

export function isValidPlacement(candidate: Placement, placements: Placement[], container: Container) {
  return inBounds(candidate, container) && placements.every((item) => item === candidate || !overlaps(candidate, item));
}

export function snap(value: number, grid: number) {
  return Math.round(value / Math.max(1, grid)) * Math.max(1, grid);
}

export function provisionalMetrics(container: Container | null, boxes: BoxType[], placements: Placement[]): Metrics {
  if (!container) {
    return {
      volume_utilization_pct: 0,
      packed_count: 0,
      unplaced_count: boxes.reduce((sum, box) => sum + box.count, 0),
      total_weight_kg: 0,
      weight_utilization_pct: null,
      container_volume_mm3: 0,
    };
  }
  const volume = container.length_mm * container.width_mm * container.height_mm;
  const packedVolume = placements.reduce(
    (sum, item) => sum + item.size_mm.length * item.size_mm.width * item.size_mm.height,
    0,
  );
  const boxMap = new Map(boxes.map((box) => [box.id, box]));
  const weight = placements.reduce((sum, item) => sum + Number(boxMap.get(item.box_id)?.weight_kg ?? 0), 0);
  const capacity = Number(container.max_weight_kg ?? 0);
  return {
    volume_utilization_pct: volume ? Math.round((packedVolume * 10000) / volume) / 100 : 0,
    packed_count: placements.length,
    unplaced_count: Math.max(0, boxes.reduce((sum, box) => sum + box.count, 0) - placements.length),
    total_weight_kg: Math.round(weight * 1000) / 1000,
    weight_utilization_pct: capacity ? Math.round((weight * 10000) / capacity) / 100 : null,
    container_volume_mm3: volume,
  };
}

export function findOpenPosition(box: BoxType, placements: Placement[], container: Container, grid: number): Placement | null {
  const size = sizeForOrientation(box, "LWH");
  const used = new Set(placements.filter((item) => item.box_id === box.id).map((item) => item.instance_index));
  const instanceIndex = Array.from({ length: box.count }, (_, index) => index).find((index) => !used.has(index));
  if (instanceIndex === undefined) return null;
  const points = new Map<string, { x: number; y: number; z: number }>();
  const addPoint = (x: number, y: number, z: number) => {
    const point = { x: snap(x, grid), y: snap(y, grid), z: snap(z, grid) };
    points.set(`${point.x}:${point.y}:${point.z}`, point);
  };
  addPoint(0, 0, 0);
  placements.forEach((item) => {
    addPoint(item.position_mm.x + item.size_mm.length, item.position_mm.y, item.position_mm.z);
    addPoint(item.position_mm.x, item.position_mm.y + item.size_mm.width, item.position_mm.z);
    addPoint(item.position_mm.x, item.position_mm.y, item.position_mm.z + item.size_mm.height);
  });
  for (const position of [...points.values()].sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x)) {
    const candidate: Placement = {
      box_id: box.id,
      instance_index: instanceIndex,
      position_mm: position,
      size_mm: size,
      orientation: "LWH",
    };
    if (isValidPlacement(candidate, placements, container)) return candidate;
  }
  return null;
}
