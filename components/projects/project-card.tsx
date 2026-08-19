"use client";

import Link from "next/link";
import { ArrowUpRight, Box, Trash2 } from "lucide-react";
import type { Project } from "@/types/api";

export function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const updated = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(project.updated_at));
  return (
    <article className="project-card">
      <div className="project-card-top"><span className="project-icon"><Box size={21} /></span><button className="icon-button" aria-label={`Delete ${project.name}`} onClick={onDelete}><Trash2 size={16} /></button></div>
      <div><p className="micro-label">Updated {updated}</p><h2>{project.name}</h2><p>{project.description || "No description yet."}</p></div>
      <dl><div><dt>Box types</dt><dd>{project.box_count}</dd></div><div><dt>Container</dt><dd>{project.container ? `${project.container.length_mm} × ${project.container.width_mm}` : "Not set"}</dd></div></dl>
      <Link href={`/projects/${project.id}`}>Open workspace <ArrowUpRight size={16} /></Link>
    </article>
  );
}
