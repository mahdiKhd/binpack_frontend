"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowDownToLine, Box, Grid3X3, Redo2, RotateCw, Save, Trash2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { buildBoxTypeColorMap } from "@/lib/box-colors";
import { findOpenPosition, isValidPlacement, ORIENTATIONS, sizeForOrientation, snap } from "@/lib/geometry";
import { apiFetch, ApiError } from "@/lib/api";
import { placementKey, useEditorStore } from "@/stores/editor-store";
import type { BoxType, Container, Layout, Orientation, Placement } from "@/types/api";

export function EditorPanel({
  projectId,
  container,
  boxes,
  layout,
  onSaved,
}: {
  projectId: string;
  container: Container | null;
  boxes: BoxType[];
  layout: Layout | null;
  onSaved: (layout: Layout) => void;
}) {
  const placements = useEditorStore((state) => state.placements);
  const selectedKey = useEditorStore((state) => state.selectedKey);
  const gridMm = useEditorStore((state) => state.gridMm);
  const dirty = useEditorStore((state) => state.dirty);
  const canUndo = useEditorStore((state) => state.past.length > 0);
  const canRedo = useEditorStore((state) => state.future.length > 0);
  const { load, commit, undo, redo, reset, setGrid, select } = useEditorStore.getState();
  const [name, setName] = useState(layout?.name ?? "");
  const [respectStacking, setRespectStacking] = useState(false);

  useEffect(() => {
    load(layout?.placements.placements ?? []);
  }, [layout?.placements.placements, load]);

  const selected = placements.find((item) => placementKey(item) === selectedKey) ?? null;
  const boxMap = useMemo(() => new Map(boxes.map((box) => [box.id, box])), [boxes]);
  const displayColors = useMemo(() => buildBoxTypeColorMap(boxes), [boxes]);
  const counts = useMemo(() => {
    const used = new Map<string, number>();
    placements.forEach((item) => used.set(item.box_id, (used.get(item.box_id) ?? 0) + 1));
    return used;
  }, [placements]);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name || "Manual layout",
        is_saved: true,
        respect_stacking: respectStacking,
        placements: { placements, unplaced: [] },
      };
      return layout
        ? apiFetch<Layout>(`/layouts/${layout.id}`, { method: "PATCH", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } })
        : apiFetch<Layout>(`/projects/${projectId}/layouts`, { method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
    },
    onSuccess: (saved) => { onSaved(saved); load(saved.placements.placements); toast.success("Layout saved and validated."); },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "The layout could not be saved."),
  });

  const addBox = (box: BoxType) => {
    if (!container) return;
    const placement = findOpenPosition(box, placements, container, gridMm);
    if (!placement) return toast.error("No valid open grid position was found for this box.");
    commit([...placements, placement]);
    select(placementKey(placement));
  };

  const replaceSelected = (next: Placement) => {
    if (!container || !selected) return;
    const others = placements.filter((item) => placementKey(item) !== placementKey(selected));
    if (!isValidPlacement(next, others, container)) return toast.error("That move would collide or leave the container.");
    commit(placements.map((item) => placementKey(item) === placementKey(selected) ? next : item));
  };

  const nudge = (axis: "x" | "y" | "z", amount: number) => {
    if (!selected || !container) return;
    const position = { ...selected.position_mm, [axis]: snap(selected.position_mm[axis] + amount, gridMm) };
    replaceSelected({ ...selected, position_mm: position });
  };

  const rotate = () => {
    if (!selected) return;
    const box = boxMap.get(selected.box_id);
    if (!box?.allow_rotation) return toast.error("Rotation is disabled for this box type.");
    const nextIndex = (ORIENTATIONS.indexOf(selected.orientation) + 1) % ORIENTATIONS.length;
    const orientation = ORIENTATIONS[nextIndex] as Orientation;
    replaceSelected({ ...selected, orientation, size_mm: sizeForOrientation(box, orientation) });
  };

  const dropToFloor = () => {
    if (!selected) return;
    const others = placements.filter((item) => placementKey(item) !== placementKey(selected));
    const supports = others.filter((item) => {
      const xOverlap = selected.position_mm.x < item.position_mm.x + item.size_mm.length && selected.position_mm.x + selected.size_mm.length > item.position_mm.x;
      const yOverlap = selected.position_mm.y < item.position_mm.y + item.size_mm.width && selected.position_mm.y + selected.size_mm.width > item.position_mm.y;
      return xOverlap && yOverlap && item.position_mm.z + item.size_mm.height <= selected.position_mm.z;
    });
    const z = Math.max(0, ...supports.map((item) => item.position_mm.z + item.size_mm.height));
    replaceSelected({ ...selected, position_mm: { ...selected.position_mm, z } });
  };

  const remove = () => {
    if (!selected) return;
    commit(placements.filter((item) => placementKey(item) !== placementKey(selected)));
    select(null);
  };

  if (!container) return <div className="panel-empty"><Box size={22} /><h3>Configure the container first</h3><p>The editor needs physical bounds before it can validate a placement.</p></div>;

  return (
    <div className="editor-panel">
      <section className="editor-section">
        <div className="section-row"><div><p className="micro-label">Box tray</p><h3>Unplaced instances</h3></div><span>{boxes.reduce((sum, box) => sum + Math.max(0, box.count - (counts.get(box.id) ?? 0)), 0)} left</span></div>
        <div className="box-tray">
          {boxes.map((box) => {
            const remaining = Math.max(0, box.count - (counts.get(box.id) ?? 0));
            return <button key={box.id} disabled={!remaining} draggable={Boolean(remaining)} onDragStart={(event) => event.dataTransfer.setData("application/x-packlab-box", box.id)} onClick={() => addBox(box)}><i style={{ background: displayColors.get(box.id) }} /><span><strong>{box.label}</strong><small>{box.length_mm} × {box.width_mm} × {box.height_mm} mm</small></span><b>{remaining}</b></button>;
          })}
          {!boxes.length ? <p className="muted">Add box types in Setup.</p> : null}
        </div>
      </section>

      <section className="editor-section">
        <div className="section-row"><div><p className="micro-label">Selected box</p><h3>{selected ? `${boxMap.get(selected.box_id)?.label ?? "Box"} #${selected.instance_index + 1}` : "Nothing selected"}</h3></div>{dirty ? <span className="dirty-dot">Unsaved</span> : null}</div>
        {selected ? <><div className="position-readout"><span>X <b>{selected.position_mm.x}</b></span><span>Y <b>{selected.position_mm.y}</b></span><span>Z <b>{selected.position_mm.z}</b></span></div><div className="nudge-grid"><button onClick={() => nudge("y", gridMm)}>Y+</button><button onClick={() => nudge("z", gridMm)}>Z+</button><button onClick={() => nudge("x", gridMm)}>X+</button><button onClick={() => nudge("y", -gridMm)}>Y−</button><button onClick={() => nudge("z", -gridMm)}>Z−</button><button onClick={() => nudge("x", -gridMm)}>X−</button></div><div className="editor-actions"><Button variant="secondary" onClick={rotate}><RotateCw size={15} /> Rotate</Button><Button variant="secondary" onClick={dropToFloor}><ArrowDownToLine size={15} /> Drop</Button><Button variant="danger" onClick={remove}><Trash2 size={15} /> Remove</Button></div></> : <p className="muted">Click a box in the scene to move, rotate, or remove it.</p>}
      </section>

      <section className="editor-section compact">
        <label className="inline-setting"><Grid3X3 size={16} /><span>Snap grid</span><Input type="number" min={1} value={gridMm} onChange={(event) => setGrid(Math.max(1, Number(event.target.value)))} /><small>mm</small></label>
        <div className="editor-actions"><Button variant="ghost" onClick={undo} disabled={!canUndo}><Undo2 size={15} /> Undo</Button><Button variant="ghost" onClick={redo} disabled={!canRedo}><Redo2 size={15} /> Redo</Button><Button variant="ghost" onClick={reset}>Reset</Button></div>
      </section>

      <section className="editor-save">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Layout name" />
        <label className="check-row"><input type="checkbox" checked={respectStacking} onChange={(event) => setRespectStacking(event.target.checked)} /><span>Validate stacking and load bearing</span></label>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !placements.length}><Save size={16} />{save.isPending ? "Validating…" : "Save layout"}</Button>
      </section>
    </div>
  );
}
