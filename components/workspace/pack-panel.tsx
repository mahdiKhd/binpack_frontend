"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Check, Clock3, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-field";
import { apiFetch, ApiError } from "@/lib/api";
import type { Algorithm, BoxType, Container, Layout, PackingJob, Page } from "@/types/api";

const algorithmBadge: Record<string, string> = {
  ffd_extreme_point: "FF",
  shelf_layer: "SL",
  best_fit_extreme_point: "BF",
  grasp_extreme_point: "GR",
};

export function PackPanel({ projectId, container, boxes, algorithms, verified, onLayout }: { projectId: string; container: Container | null; boxes: BoxType[]; algorithms: Algorithm[]; verified: boolean; onLayout: (layout: Layout) => void }) {
  const queryClient = useQueryClient();
  const [algorithmKey, setAlgorithmKey] = useState("");
  const [parameters, setParameters] = useState<Record<string, boolean | number>>({});
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const handledLayout = useRef<string | null>(null);
  const algorithm = useMemo(() => algorithms.find((item) => item.key === algorithmKey) ?? algorithms[0], [algorithmKey, algorithms]);

  const effectiveParameters = useMemo(
    () => algorithm ? Object.fromEntries(Object.entries(algorithm.parameters).map(([key, spec]) => [key, parameters[key] ?? spec.default])) : {},
    [algorithm, parameters],
  );

  const recentJobs = useQuery({ queryKey: ["packing-jobs", projectId], queryFn: () => apiFetch<Page<PackingJob>>(`/projects/${projectId}/packing-jobs`) });
  const jobQuery = useQuery({
    queryKey: ["packing-job", activeJobId],
    queryFn: () => apiFetch<PackingJob>(`/packing-jobs/${activeJobId}`),
    enabled: Boolean(activeJobId),
    refetchInterval: (query) => ["queued", "running"].includes(query.state.data?.status ?? "") ? 1500 : false,
  });

  const run = useMutation({
    mutationFn: () => apiFetch<PackingJob>(`/projects/${projectId}/packing-jobs`, { method: "POST", body: JSON.stringify({ algorithm: algorithm?.key, parameters: effectiveParameters }), headers: { "Content-Type": "application/json" } }),
    onSuccess: (job) => { setActiveJobId(job.id); handledLayout.current = null; void queryClient.invalidateQueries({ queryKey: ["packing-jobs", projectId] }); toast.success("Packing job queued."); },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Unable to start packing."),
  });
  const cancel = useMutation({
    mutationFn: () => apiFetch<PackingJob>(`/packing-jobs/${activeJobId}/cancel`, { method: "POST" }),
    onSuccess: (job) => { queryClient.setQueryData(["packing-job", activeJobId], job); toast.success("Packing job cancelled."); },
  });

  const job = jobQuery.data ?? (run.data?.id === activeJobId ? run.data : null);
  useEffect(() => {
    if (job?.status !== "succeeded" || !job.layout_id || handledLayout.current === job.layout_id) return;
    handledLayout.current = job.layout_id;
    apiFetch<Layout>(`/layouts/${job.layout_id}`)
      .then((layout) => { onLayout(layout); void queryClient.invalidateQueries({ queryKey: ["layouts", projectId] }); })
      .catch(() => toast.error("The job completed, but its layout could not be loaded."));
  }, [job, onLayout, projectId, queryClient]);

  const canRun = Boolean(container && boxes.length && algorithm && verified);
  return (
    <div className="pack-panel panel-scroll">
      <section className="workspace-section">
        <p className="micro-label">Algorithm</p><h2>Choose a packing strategy</h2>
        <div className="algorithm-cards">{algorithms.map((item) => <button key={item.key} className={algorithm?.key === item.key ? "selected" : ""} onClick={() => { setAlgorithmKey(item.key); setParameters(Object.fromEntries(Object.entries(item.parameters).map(([key, spec]) => [key, spec.default]))); }}><span>{algorithmBadge[item.key] ?? "3D"}</span><i><strong>{item.display_name}</strong><small>{item.description}</small></i>{algorithm?.key === item.key ? <Check size={16} /> : null}</button>)}</div>
        {!algorithms.length ? <p className="muted">No algorithms were returned by the API.</p> : null}
      </section>
      {algorithm ? <section className="workspace-section"><p className="micro-label">Parameters</p><h2>Tune the run</h2><div className="parameter-list">{Object.entries(algorithm.parameters).map(([key, spec]) => spec.type === "boolean" ? <label className="toggle-row" key={key}><span><strong>{key.replaceAll("_", " ")}</strong><small>{spec.description}</small></span><input type="checkbox" checked={Boolean(effectiveParameters[key])} onChange={(event) => setParameters((current) => ({ ...current, [key]: event.target.checked }))} /></label> : <label className="parameter-number" key={key}><span><strong>{key.replaceAll("_", " ")}</strong><small>{spec.description}</small></span><Input type="number" min={spec.minimum} max={spec.maximum} value={Number(effectiveParameters[key])} onChange={(event) => setParameters((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>)}</div></section> : null}
      <section className="run-card"><div><p className="micro-label">Ready check</p><ul><li className={container ? "ready" : ""}>{container ? <Check /> : <Clock3 />} Container configured</li><li className={boxes.length ? "ready" : ""}>{boxes.length ? <Check /> : <Clock3 />} {boxes.length} box type{boxes.length === 1 ? "" : "s"}</li><li className={verified ? "ready" : ""}>{verified ? <ShieldCheck /> : <Clock3 />} Email verified</li></ul></div><Button onClick={() => run.mutate()} disabled={!canRun || run.isPending || ["queued", "running"].includes(job?.status ?? "")}><Play size={16} /> {run.isPending ? "Submitting…" : "Run packing"}</Button></section>
      {job ? <section className={`job-card job-${job.status}`}><div className="section-row"><div><p className="micro-label">Active job</p><h3>{job.status === "running" ? "Finding a fit…" : job.status.charAt(0).toUpperCase() + job.status.slice(1)}</h3></div><span>{job.progress}%</span></div><div className="job-progress"><i style={{ width: `${job.progress}%` }} /></div>{job.error_message ? <p className="form-alert">{job.error_message}</p> : null}<div className="job-actions">{["queued", "running"].includes(job.status) ? <Button variant="danger" onClick={() => cancel.mutate()}><Ban size={15} /> Cancel</Button> : <Button variant="secondary" onClick={() => run.mutate()}><RotateCcw size={15} /> Run again</Button>}</div></section> : null}
      <section className="workspace-section"><p className="micro-label">Recent runs</p><div className="mini-history">{recentJobs.data?.results.slice(0, 4).map((item) => <button key={item.id} onClick={() => setActiveJobId(item.id)}><span className={`job-dot ${item.status}`} /><i><strong>{algorithms.find((algorithm) => algorithm.key === item.algorithm)?.display_name ?? item.algorithm}</strong><small>{new Date(item.created_at).toLocaleString()}</small></i><b>{item.status}</b></button>)}{!recentJobs.data?.results.length ? <p className="muted">No packing jobs yet.</p> : null}</div></section>
    </div>
  );
}
