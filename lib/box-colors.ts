import type { BoxType } from "@/types/api";

export const BOX_TYPE_PALETTE = [
  "#5b6cff",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#eab308",
  "#ef4444",
  "#14b8a6",
  "#f43f5e",
  "#84cc16",
  "#6366f1",
  "#d946ef",
  "#0ea5e9",
  "#a16207",
  "#22c55e",
] as const;

type ColorBox = Pick<BoxType, "id" | "color">;

function normalizeHex(color: string | null | undefined): string | null {
  if (!color) return null;
  const value = color.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  const short = value.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  return short ? `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}` : null;
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = hue / 60;
  const intermediate = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, intermediate, 0]
    : segment < 2 ? [intermediate, chroma, 0]
      : segment < 3 ? [0, chroma, intermediate]
        : segment < 4 ? [0, intermediate, chroma]
          : segment < 5 ? [intermediate, 0, chroma]
            : [chroma, 0, intermediate];
  const offset = l - chroma / 2;
  return `#${[red, green, blue].map((channel) => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("")}`;
}

function firstUnusedColor(used: Set<string>): string {
  const paletteColor = BOX_TYPE_PALETTE.find((color) => !used.has(color));
  if (paletteColor) return paletteColor;

  for (let index = 0; ; index += 1) {
    const generated = hslToHex((index * 137.508 + 23) % 360, 68, 52);
    if (!used.has(generated)) return generated;
  }
}

/**
 * Preserves genuinely unique configured colors and replaces duplicates with a
 * deterministic, high-contrast palette. Sorting by id makes the result stable
 * even if the API returns box types in another order.
 */
export function buildBoxTypeColorMap(boxes: ColorBox[]): Map<string, string> {
  const normalized = new Map(boxes.map((box) => [box.id, normalizeHex(box.color)]));
  const counts = new Map<string, number>();
  normalized.forEach((color) => {
    if (color) counts.set(color, (counts.get(color) ?? 0) + 1);
  });

  const colors = new Map<string, string>();
  const used = new Set<string>();
  boxes.forEach((box) => {
    const color = normalized.get(box.id);
    if (color && counts.get(color) === 1) {
      colors.set(box.id, color);
      used.add(color);
    }
  });

  [...boxes]
    .sort((left, right) => left.id.localeCompare(right.id))
    .forEach((box) => {
      if (colors.has(box.id)) return;
      const color = firstUnusedColor(used);
      colors.set(box.id, color);
      used.add(color);
    });

  return colors;
}

export function nextBoxTypeColor(boxes: ColorBox[]): string {
  const used = new Set(buildBoxTypeColorMap(boxes).values());
  return firstUnusedColor(used);
}
