"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { apiFetch, ApiError } from "@/lib/api";
import type { Page, Project } from "@/types/api";

interface ProjectForm { name: string; description: string }

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm<ProjectForm>();
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => apiFetch<Page<Project>>("/projects") });
  const visible = useMemo(() => (projects.data?.results ?? []).filter((project) => `${project.name} ${project.description}`.toLowerCase().includes(search.toLowerCase())), [projects.data, search]);

  const createProject = useMutation({
    mutationFn: (values: ProjectForm) => apiFetch<Project>("/projects", { method: "POST", body: JSON.stringify(values), headers: { "Content-Type": "application/json" } }),
    onSuccess: (project) => { void queryClient.invalidateQueries({ queryKey: ["projects"] }); reset(); setCreating(false); toast.success("Project created."); router.push(`/projects/${project.id}`); },
    onError: (error) => setError("root", { message: error instanceof ApiError ? error.message : "Unable to create the project." }),
  });

  const deleteProject = useMutation({
    mutationFn: (id: string) => apiFetch(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted."); },
  });

  return (
    <div className="dashboard page-pad">
      <header className="page-header"><div><p className="eyebrow"><span /> Project library</p><h1>Your packing work.</h1><p>Create a load, tune the rules, then inspect every millimetre.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> New project</Button></header>
      <div className="dashboard-toolbar"><label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" /></label><span>{visible.length} project{visible.length === 1 ? "" : "s"}</span></div>
      {projects.isPending ? <div className="card-grid skeleton-grid"><i /><i /><i /></div> : projects.isError ? <div className="empty-state"><h2>Couldn’t load projects</h2><p>Check that the Django API is running and the frontend API URL is correct.</p><Button onClick={() => projects.refetch()}>Try again</Button></div> : visible.length ? <div className="card-grid">{visible.map((project) => <ProjectCard key={project.id} project={project} onDelete={() => { if (window.confirm(`Delete “${project.name}” and all of its layouts?`)) deleteProject.mutate(project.id); }} />)}</div> : <div className="empty-state"><span className="empty-cube" /><p className="micro-label">No projects here</p><h2>Your first load starts with three dimensions.</h2><p>Create a project, choose a container, and add the boxes you need to fit.</p><Button onClick={() => setCreating(true)}>Create first project <ArrowRight size={17} /></Button></div>}
      {creating ? <div className="modal-backdrop" role="presentation" onMouseDown={() => setCreating(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title" onMouseDown={(event) => event.stopPropagation()}><p className="micro-label">New project</p><h2 id="new-project-title">Name the load</h2><p>You can change these details later.</p><form className="form-stack" onSubmit={handleSubmit((values) => createProject.mutate(values))}><Field label="Project name" error={errors.name?.message}><Input autoFocus {...register("name", { required: "Enter a project name." })} placeholder="e.g. Lab equipment shipment" /></Field><Field label="Description"><textarea className="input textarea" {...register("description")} placeholder="What are you packing?" /></Field>{errors.root ? <p className="form-alert">{errors.root.message}</p> : null}<div className="modal-actions"><Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" disabled={createProject.isPending}>{createProject.isPending ? "Creating…" : "Create project"}</Button></div></form></section></div> : null}
    </div>
  );
}
