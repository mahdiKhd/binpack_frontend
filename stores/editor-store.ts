import { create } from "zustand";
import type { Placement } from "@/types/api";

interface EditorState {
  placements: Placement[];
  past: Placement[][];
  future: Placement[][];
  selectedKey: string | null;
  dirty: boolean;
  gridMm: number;
  load: (placements: Placement[]) => void;
  commit: (placements: Placement[]) => void;
  select: (key: string | null) => void;
  setGrid: (grid: number) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export const placementKey = (placement: Placement) => `${placement.box_id}:${placement.instance_index}`;

export const useEditorStore = create<EditorState>((set, get) => ({
  placements: [],
  past: [],
  future: [],
  selectedKey: null,
  dirty: false,
  gridMm: 50,
  load: (placements) => set({ placements, past: [], future: [], selectedKey: null, dirty: false }),
  commit: (placements) => {
    const current = get().placements;
    set({ placements, past: [...get().past, current], future: [], dirty: true });
  },
  select: (selectedKey) => set({ selectedKey }),
  setGrid: (gridMm) => set({ gridMm }),
  undo: () => {
    const past = get().past;
    if (!past.length) return;
    const previous = past[past.length - 1];
    set({ placements: previous, past: past.slice(0, -1), future: [get().placements, ...get().future], dirty: true });
  },
  redo: () => {
    const future = get().future;
    if (!future.length) return;
    const next = future[0];
    set({ placements: next, past: [...get().past, get().placements], future: future.slice(1), dirty: true });
  },
  reset: () => set({ placements: [], past: [...get().past, get().placements], future: [], selectedKey: null, dirty: true }),
}));
