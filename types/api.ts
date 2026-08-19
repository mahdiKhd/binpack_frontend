export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  is_email_verified: boolean;
  date_joined: string;
}

export interface Container {
  id: UUID;
  name: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  max_weight_kg: string | number | null;
  based_on_preset: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContainerPreset {
  key: string;
  display_name: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  max_weight_kg: string | number;
  category: string;
}

export interface BoxType {
  id: UUID;
  label: string;
  length_mm: number;
  width_mm: number;
  height_mm: number;
  weight_kg: string | number;
  count: number;
  color: string;
  is_stackable: boolean;
  max_load_kg: string | number | null;
  allow_rotation: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: UUID;
  name: string;
  description: string;
  box_count: number;
  container: Container | null;
  created_at: string;
  updated_at: string;
}

export type Orientation = "LWH" | "LHW" | "WLH" | "WHL" | "HLW" | "HWL";

export interface Placement {
  box_id: UUID;
  instance_index: number;
  position_mm: { x: number; y: number; z: number };
  size_mm: { length: number; width: number; height: number };
  orientation: Orientation;
}

export interface PlacementPayload {
  placements: Placement[];
  unplaced: { box_id: UUID; count: number }[];
}

export interface Metrics {
  volume_utilization_pct: number;
  packed_count: number;
  unplaced_count: number;
  total_weight_kg: number;
  weight_utilization_pct: number | null;
  container_volume_mm3: number;
}

export interface Layout {
  id: UUID;
  project: UUID;
  source: "manual" | "algorithm";
  job: UUID | null;
  name: string;
  is_saved: boolean;
  placements: PlacementPayload;
  metrics: Metrics;
  created_at: string;
  updated_at: string;
}

export interface PackingJob {
  id: UUID;
  project: UUID;
  algorithm: string;
  parameters: Record<string, boolean | number>;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  progress: number;
  error_message: string;
  layout_id: UUID | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface AlgorithmParameter {
  type: "boolean" | "integer";
  default: boolean | number;
  description: string;
  minimum?: number;
  maximum?: number;
}

export interface Algorithm {
  key: string;
  display_name: string;
  description: string;
  parameters: Record<string, AlgorithmParameter>;
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Artifact {
  id: UUID;
  layout: UUID;
  format: "png" | "pdf" | "csv";
  url: string;
  created_at: string;
}

export interface ApiErrorEnvelope {
  error?: { code?: string; message?: string; details?: Record<string, unknown> };
}
