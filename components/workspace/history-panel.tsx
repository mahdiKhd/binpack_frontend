"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, FileImage, FileText, Table2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { captureViewerPng } from "@/components/three/packing-viewer";
import { apiFetch, ApiError } from "@/lib/api";
import type { Artifact, Layout, Page } from "@/types/api";

function downloadArtifact(artifact: Artifact) {
  const link = document.createElement("a");
  link.href = artifact.url;
  link.target = "_blank";
  link.rel = "noopener";
  link.click();
}

export function HistoryPanel({ projectId, currentLayoutId, verified, onView }: { projectId: string; currentLayoutId: string | null; verified: boolean; onView: (layout: Layout) => void }) {
  const queryClient = useQueryClient();
  const layouts = useQuery({ queryKey: ["layouts", projectId], queryFn: () => apiFetch<Page<Layout>>(`/projects/${projectId}/layouts`) });
  const loadLayout = async (id: string) => { const layout = await apiFetch<Layout>(`/layouts/${id}`); onView(layout); };
  const remove = useMutation({ mutationFn: (id: string) => apiFetch(`/layouts/${id}`, { method: "DELETE" }), onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["layouts", projectId] }); toast.success("Layout deleted."); } });
  const exportLayout = useMutation({
    mutationFn: async ({ layout, format }: { layout: Layout; format: "png" | "pdf" | "csv" }) => {
      if (format === "png") {
        if (currentLayoutId !== layout.id) { await loadLayout(layout.id); throw new Error("The layout is now loaded. Click PNG again after the scene renders."); }
        const image = await captureViewerPng();
        const data = new FormData(); data.set("format", "png"); data.set("image", image, `layout-${layout.id}.png`);
        return apiFetch<Artifact>(`/layouts/${layout.id}/export`, { method: "POST", body: data });
      }
      return apiFetch<Artifact>(`/layouts/${layout.id}/export`, { method: "POST", body: JSON.stringify({ format }), headers: { "Content-Type": "application/json" } });
    },
    onSuccess: (artifact) => { downloadArtifact(artifact); toast.success(`${artifact.format.toUpperCase()} export ready.`); },
    onError: (error) => toast.error(error instanceof ApiError || error instanceof Error ? error.message : "Export failed."),
  });

  return <div className="history-panel panel-scroll"><section className="workspace-section"><div className="section-row"><div><p className="micro-label">Layout history</p><h2>Runs and saved outputs</h2></div><span>{layouts.data?.count ?? 0} layouts</span></div><div className="layout-history">{layouts.isPending ? <p className="muted">Loading history…</p> : layouts.data?.results.map((layout) => <article key={layout.id} className={currentLayoutId === layout.id ? "active" : ""}><div className="layout-thumbnail"><span /><span /><span /></div><div className="layout-info"><p><span className={`source-pill ${layout.source}`}>{layout.source}</span>{layout.is_saved ? <span className="saved-pill">Saved</span> : null}</p><h3>{layout.name || `${layout.source === "algorithm" ? "Algorithm result" : "Manual layout"}`}</h3><small>{new Date(layout.created_at).toLocaleString()}</small><dl><div><dt>Volume</dt><dd>{layout.metrics.volume_utilization_pct}%</dd></div><div><dt>Packed</dt><dd>{layout.metrics.packed_count}</dd></div><div><dt>Unplaced</dt><dd>{layout.metrics.unplaced_count}</dd></div></dl></div><div className="layout-actions"><Button variant="secondary" onClick={() => void loadLayout(layout.id)}><Eye size={15} /> View</Button><div className="export-buttons"><button disabled={!verified || exportLayout.isPending} title="Export CSV" onClick={() => exportLayout.mutate({ layout, format: "csv" })}><Table2 size={15} /></button><button disabled={!verified || exportLayout.isPending} title="Export PDF" onClick={() => exportLayout.mutate({ layout, format: "pdf" })}><FileText size={15} /></button><button disabled={!verified || exportLayout.isPending} title="Capture PNG" onClick={() => exportLayout.mutate({ layout, format: "png" })}><FileImage size={15} /></button><button title="Delete layout" onClick={() => { if (window.confirm("Delete this layout?")) remove.mutate(layout.id); }}><Trash2 size={15} /></button></div></div></article>)}{!layouts.isPending && !layouts.data?.results.length ? <div className="list-empty"><Download size={20} /><p>Completed algorithm runs and saved manual layouts will appear here.</p></div> : null}</div></section></div>;
}
