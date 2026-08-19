"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit3, PackagePlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-field";
import { apiFetch, ApiError } from "@/lib/api";
import { buildBoxTypeColorMap, nextBoxTypeColor } from "@/lib/box-colors";
import type { BoxType, Container, ContainerPreset } from "@/types/api";

interface ContainerValues {
  name: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  max_weight_kg: number;
  based_on_preset: string;
}

interface BoxValues {
  label: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: number;
  count: number;
  color: string;
  is_stackable: boolean;
  max_load_kg: number | string;
  allow_rotation: boolean;
}

const emptyBox: BoxValues = { label: "", length_mm: 400, width_mm: 300, height_mm: 200, weight_kg: 1, count: 1, color: "#5B6CFF", is_stackable: true, max_load_kg: "", allow_rotation: true };

export function SetupPanel({ projectId, container, boxes, presets }: { projectId: string; container: Container | null; boxes: BoxType[]; presets: ContainerPreset[] }) {
  const queryClient = useQueryClient();
  const [editingBox, setEditingBox] = useState<BoxType | null | undefined>(undefined);
  const containerForm = useForm<ContainerValues>({ defaultValues: { name: "Main container", length_mm: 1200, width_mm: 800, height_mm: 1000, max_weight_kg: 1000, based_on_preset: "" } });
  const boxForm = useForm<BoxValues>({ defaultValues: emptyBox });
  const selectedPreset = useWatch({ control: containerForm.control, name: "based_on_preset" });
  const displayColors = useMemo(() => buildBoxTypeColorMap(boxes), [boxes]);

  useEffect(() => {
    if (container) containerForm.reset({ name: container.name, length_mm: container.length_mm, width_mm: container.width_mm, height_mm: container.height_mm, max_weight_kg: Number(container.max_weight_kg ?? 0), based_on_preset: container.based_on_preset ?? "" });
  }, [container, containerForm]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    void queryClient.invalidateQueries({ queryKey: ["boxes", projectId] });
  };
  const saveContainer = useMutation({
    mutationFn: (values: ContainerValues) => apiFetch<Container>(`/projects/${projectId}/container`, { method: "PUT", body: JSON.stringify({ ...values, based_on_preset: values.based_on_preset || null, max_weight_kg: values.max_weight_kg || null }), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { refresh(); toast.success("Container saved."); },
    onError: (error) => containerForm.setError("root", { message: error instanceof ApiError ? error.message : "Unable to save the container." }),
  });
  const saveBox = useMutation({
    mutationFn: (values: BoxValues) => apiFetch<BoxType>(editingBox ? `/projects/${projectId}/boxes/${editingBox.id}` : `/projects/${projectId}/boxes`, { method: editingBox ? "PATCH" : "POST", body: JSON.stringify({ ...values, max_load_kg: values.max_load_kg === "" || Number.isNaN(values.max_load_kg) ? null : values.max_load_kg }), headers: { "Content-Type": "application/json" } }),
    onSuccess: () => { refresh(); setEditingBox(undefined); boxForm.reset(emptyBox); toast.success(editingBox ? "Box type updated." : "Box type added."); },
    onError: (error) => boxForm.setError("root", { message: error instanceof ApiError ? error.message : "Unable to save the box type." }),
  });
  const deleteBox = useMutation({ mutationFn: (id: string) => apiFetch(`/projects/${projectId}/boxes/${id}`, { method: "DELETE" }), onSuccess: () => { refresh(); toast.success("Box type removed."); } });

  const choosePreset = (key: string) => {
    containerForm.setValue("based_on_preset", key);
    const preset = presets.find((item) => item.key === key);
    if (!preset) return;
    containerForm.setValue("name", preset.display_name);
    containerForm.setValue("length_mm", preset.length_mm);
    containerForm.setValue("width_mm", preset.width_mm);
    containerForm.setValue("height_mm", preset.height_mm);
    containerForm.setValue("max_weight_kg", Number(preset.max_weight_kg));
  };

  const openBox = (box: BoxType | null) => {
    setEditingBox(box);
    boxForm.reset(box ? { label: box.label, length_mm: box.length_mm, width_mm: box.width_mm, height_mm: box.height_mm, weight_kg: Number(box.weight_kg), count: box.count, color: box.color, is_stackable: box.is_stackable, max_load_kg: box.max_load_kg === null ? "" : Number(box.max_load_kg), allow_rotation: box.allow_rotation } : { ...emptyBox, color: nextBoxTypeColor(boxes) });
  };

  return (
    <div className="setup-panel panel-scroll">
      <section className="workspace-section">
        <div className="section-row"><div><p className="micro-label">01 / Container</p><h2>Usable volume</h2></div>{container ? <span className="status-pill success">Configured</span> : <span className="status-pill">Required</span>}</div>
        <form className="form-stack" onSubmit={containerForm.handleSubmit((values) => saveContainer.mutate(values))}>
          <Field label="Start from a preset"><Select value={selectedPreset} onChange={(event) => choosePreset(event.target.value)}><option value="">Custom dimensions</option>{presets.map((preset) => <option key={preset.key} value={preset.key}>{preset.display_name}</option>)}</Select></Field>
          <Field label="Container name"><Input {...containerForm.register("name")} /></Field>
          <div className="dimension-grid"><Field label="Length / X" error={containerForm.formState.errors.length_mm?.message}><div className="unit-input"><Input type="number" min={1} {...containerForm.register("length_mm", { valueAsNumber: true, min: { value: 1, message: "Must be positive." } })} /><span>mm</span></div></Field><Field label="Width / Y"><div className="unit-input"><Input type="number" min={1} {...containerForm.register("width_mm", { valueAsNumber: true, min: 1 })} /><span>mm</span></div></Field><Field label="Height / Z"><div className="unit-input"><Input type="number" min={1} {...containerForm.register("height_mm", { valueAsNumber: true, min: 1 })} /><span>mm</span></div></Field></div>
          <Field label="Maximum weight" hint="Set to 0 for unlimited."><div className="unit-input"><Input type="number" min={0} step="0.001" {...containerForm.register("max_weight_kg", { valueAsNumber: true, min: 0 })} /><span>kg</span></div></Field>
          {containerForm.formState.errors.root ? <p className="form-alert">{containerForm.formState.errors.root.message}</p> : null}
          <Button type="submit" disabled={saveContainer.isPending}>{saveContainer.isPending ? "Saving…" : "Save container"}</Button>
        </form>
      </section>

      <section className="workspace-section">
        <div className="section-row"><div><p className="micro-label">02 / Box types</p><h2>What needs to fit</h2></div><Button variant="secondary" onClick={() => openBox(null)}><PackagePlus size={16} /> Add box</Button></div>
        <div className="box-list">
          {boxes.map((box) => <article key={box.id}><i style={{ background: displayColors.get(box.id) }} /><div><strong>{box.label}</strong><span>{box.length_mm} × {box.width_mm} × {box.height_mm} mm</span></div><dl><dt>Qty</dt><dd>{box.count}</dd><dt>Each</dt><dd>{Number(box.weight_kg)} kg</dd></dl><button aria-label={`Edit ${box.label}`} onClick={() => openBox(box)}><Edit3 size={15} /></button><button aria-label={`Delete ${box.label}`} onClick={() => { if (window.confirm(`Remove ${box.label}?`)) deleteBox.mutate(box.id); }}><Trash2 size={15} /></button></article>)}
          {!boxes.length ? <div className="list-empty"><PackagePlus size={20} /><p>No box types yet. Add dimensions and quantities to begin.</p></div> : null}
        </div>
      </section>

      {editingBox !== undefined ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setEditingBox(undefined)}><section className="modal modal-wide" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><p className="micro-label">{editingBox ? "Edit box type" : "New box type"}</p><h2>{editingBox ? editingBox.label : "Describe one box"}</h2><form className="form-stack" onSubmit={boxForm.handleSubmit((values) => saveBox.mutate(values))}><div className="form-columns"><Field label="Label"><Input autoFocus {...boxForm.register("label", { required: "Enter a label." })} /></Field><Field label="Quantity"><Input type="number" min={1} {...boxForm.register("count", { valueAsNumber: true, min: 1 })} /></Field></div><div className="dimension-grid"><Field label="Length"><div className="unit-input"><Input type="number" min={1} {...boxForm.register("length_mm", { valueAsNumber: true, min: 1 })} /><span>mm</span></div></Field><Field label="Width"><div className="unit-input"><Input type="number" min={1} {...boxForm.register("width_mm", { valueAsNumber: true, min: 1 })} /><span>mm</span></div></Field><Field label="Height"><div className="unit-input"><Input type="number" min={1} {...boxForm.register("height_mm", { valueAsNumber: true, min: 1 })} /><span>mm</span></div></Field></div><div className="form-columns"><Field label="Weight per box"><div className="unit-input"><Input type="number" min={0} step="0.001" {...boxForm.register("weight_kg", { valueAsNumber: true, min: 0 })} /><span>kg</span></div></Field><Field label="Display color"><Input type="color" {...boxForm.register("color")} /></Field></div><div className="form-columns"><label className="check-row"><input type="checkbox" {...boxForm.register("allow_rotation")} /><span>Allow rotation</span></label><label className="check-row"><input type="checkbox" {...boxForm.register("is_stackable")} /><span>Can support boxes</span></label></div><Field label="Maximum load on top" hint="Leave empty for unlimited."><div className="unit-input"><Input type="number" min={0} step="0.001" {...boxForm.register("max_load_kg")} /><span>kg</span></div></Field>{boxForm.formState.errors.root ? <p className="form-alert">{boxForm.formState.errors.root.message}</p> : null}<div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setEditingBox(undefined)}>Cancel</Button><Button type="submit" disabled={saveBox.isPending}>{saveBox.isPending ? "Saving…" : editingBox ? "Update box" : "Add box"}</Button></div></form></section></div> : null}
    </div>
  );
}
