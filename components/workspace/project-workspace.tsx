"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Boxes, Clock3, Cuboid, PackageCheck, Settings2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { PackingViewer } from "@/components/three/packing-viewer";
import { EditorPanel } from "@/components/workspace/editor-panel";
import { HistoryPanel } from "@/components/workspace/history-panel";
import { MetricsPanel } from "@/components/workspace/metrics-panel";
import { PackPanel } from "@/components/workspace/pack-panel";
import { SetupPanel } from "@/components/workspace/setup-panel";
import { findOpenPosition, isValidPlacement, provisionalMetrics, snap } from "@/lib/geometry";
import { apiFetch } from "@/lib/api";
import { placementKey, useEditorStore } from "@/stores/editor-store";
import { useAuthStore } from "@/stores/auth-store";
import type { Algorithm, BoxType, ContainerPreset, Layout, Placement, Project } from "@/types/api";

type Tab = "setup" | "pack" | "editor" | "history";
const tabs: { id: Tab; label: string; icon: typeof Settings2 }[] = [
  { id: "setup", label: "Setup", icon: Settings2 },
  { id: "pack", label: "Pack", icon: PackageCheck },
  { id: "editor", label: "Editor", icon: Cuboid },
  { id: "history", label: "History", icon: Clock3 },
];

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>("setup");
  const [currentLayout, setCurrentLayout] = useState<Layout | null>(null);
  const user = useAuthStore((state) => state.user)!;
  const project = useQuery({ queryKey: ["project", projectId], queryFn: () => apiFetch<Project>(`/projects/${projectId}`) });
  const boxes = useQuery({ queryKey: ["boxes", projectId], queryFn: () => apiFetch<BoxType[]>(`/projects/${projectId}/boxes`) });
  const presets = useQuery({ queryKey: ["container-presets"], queryFn: () => apiFetch<ContainerPreset[]>("/container-presets") });
  const algorithms = useQuery({ queryKey: ["algorithms"], queryFn: () => apiFetch<Algorithm[]>("/algorithms") });
  const editorPlacements = useEditorStore((state) => state.placements);
  const selectedKey = useEditorStore((state) => state.selectedKey);
  const container = project.data?.container ?? null;
  const boxList = useMemo(() => boxes.data ?? [], [boxes.data]);

  const displayPlacements = tab === "editor" ? editorPlacements : currentLayout?.placements.placements ?? [];
  const displayMetrics = useMemo(
    () => tab === "editor" ? provisionalMetrics(container, boxList, editorPlacements) : currentLayout?.metrics ?? provisionalMetrics(container, boxList, []),
    [boxList, container, currentLayout, editorPlacements, tab],
  );

  const acceptLayout = useCallback((layout: Layout) => {
    setCurrentLayout(layout);
    setTab("editor");
  }, []);

  const movePlacement = (moved: Placement) => {
    if (!container) return;
    const state = useEditorStore.getState();
    const candidate = {
      ...moved,
      position_mm: {
        x: snap(moved.position_mm.x, state.gridMm),
        y: snap(moved.position_mm.y, state.gridMm),
        z: snap(moved.position_mm.z, state.gridMm),
      },
    };
    const others = state.placements.filter((item) => placementKey(item) !== placementKey(candidate));
    if (!isValidPlacement(candidate, others, container)) return toast.error("The snapped position is not valid.");
    state.commit(state.placements.map((item) => placementKey(item) === placementKey(candidate) ? candidate : item));
  };

  const dropBox = (boxId: string) => {
    if (!container) return;
    const box = boxList.find((item) => item.id === boxId);
    if (!box) return;
    const state = useEditorStore.getState();
    const placement = findOpenPosition(box, state.placements, container, state.gridMm);
    if (!placement) return toast.error("No valid open position was found.");
    state.commit([...state.placements, placement]);
    state.select(placementKey(placement));
  };

  if (project.isPending) return <div className="workspace-loading"><div className="loader-line"><i /></div><p>Loading project workspace…</p></div>;
  if (project.isError || !project.data) return <div className="empty-state workspace-error"><h2>Project unavailable</h2><p>It may have been deleted, or the API is not reachable.</p><Link className="button button-primary" href="/dashboard">Back to projects</Link></div>;

  return (
    <div className="workspace-page">
      <header className="workspace-header">
        <div className="workspace-title"><Link href="/dashboard" aria-label="Back to projects"><ArrowLeft size={18} /></Link><i /><div><p className="micro-label">Project workspace</p><h1>{project.data.name}</h1></div></div>
        <nav className="workspace-tabs" aria-label="Project sections">{tabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><item.icon size={16} />{item.label}</button>)}</nav>
        <div className="workspace-summary"><Boxes size={17} /><span><strong>{boxList.reduce((sum, box) => sum + box.count, 0)}</strong> boxes</span></div>
      </header>
      <div className="workspace-grid">
        <aside className="workspace-panel">
          {tab === "setup" ? <SetupPanel projectId={projectId} container={container} boxes={boxList} presets={presets.data ?? []} /> : null}
          {tab === "pack" ? <PackPanel projectId={projectId} container={container} boxes={boxList} algorithms={algorithms.data ?? []} verified={user.is_email_verified} onLayout={acceptLayout} /> : null}
          {tab === "editor" ? <EditorPanel key={currentLayout?.id ?? "new"} projectId={projectId} container={container} boxes={boxList} layout={currentLayout} onSaved={(layout) => setCurrentLayout(layout)} /> : null}
          {tab === "history" ? <HistoryPanel projectId={projectId} currentLayoutId={currentLayout?.id ?? null} verified={user.is_email_verified} onView={setCurrentLayout} /> : null}
        </aside>
        <section
          className={`viewer-panel ${tab === "editor" ? "editing" : ""}`}
          onDragOver={(event) => { if (event.dataTransfer.types.includes("application/x-packlab-box")) event.preventDefault(); }}
          onDrop={(event) => { event.preventDefault(); dropBox(event.dataTransfer.getData("application/x-packlab-box")); }}
        >
          <div className="viewer-head"><div><p className="micro-label">3D viewport</p><h2>{currentLayout?.name || (tab === "editor" ? "Manual arrangement" : "Container preview")}</h2></div><span className="coordinate-chip">X length · Y depth · Z up</span></div>
          <div className="viewer-body"><PackingViewer container={container ?? undefined} boxes={boxList} placements={displayPlacements} selectedKey={tab === "editor" ? selectedKey : null} editable={tab === "editor"} onSelect={(key) => useEditorStore.getState().select(key)} onMove={movePlacement} /></div>
          <MetricsPanel metrics={displayMetrics} />
        </section>
      </div>
    </div>
  );
}
