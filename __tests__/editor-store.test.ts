import { beforeEach, describe, expect, it } from "vitest";
import { useEditorStore } from "@/stores/editor-store";
import type { Placement } from "@/types/api";

const placement: Placement = { box_id: "b", instance_index: 0, position_mm: { x: 0, y: 0, z: 0 }, size_mm: { length: 10, width: 10, height: 10 }, orientation: "LWH" };

describe("editor history", () => {
  beforeEach(() => useEditorStore.getState().load([]));

  it("supports commit, undo, and redo", () => {
    useEditorStore.getState().commit([placement]);
    expect(useEditorStore.getState().placements).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().placements).toHaveLength(0);
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().placements).toEqual([placement]);
  });

  it("clears redo history after a new edit", () => {
    useEditorStore.getState().commit([placement]);
    useEditorStore.getState().undo();
    useEditorStore.getState().commit([{ ...placement, instance_index: 1 }]);
    expect(useEditorStore.getState().future).toEqual([]);
  });
});
