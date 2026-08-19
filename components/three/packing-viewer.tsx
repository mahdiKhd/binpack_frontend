"use client";

import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import type { PackingSceneProps } from "./packing-scene";

const Scene = dynamic(() => import("./packing-scene"), { ssr: false, loading: () => <div className="viewer-loading">Preparing 3D view…</div> });

export function PackingViewer(props: Partial<PackingSceneProps>) {
  if (!props.container) return <div className="viewer-empty"><Box size={28} /><h3>No container yet</h3><p>Configure usable dimensions in Setup to activate the 3D workspace.</p></div>;
  return <div className="viewer-canvas"><Scene {...(props as PackingSceneProps)} /></div>;
}

export async function captureViewerPng() {
  const canvas = document.querySelector<HTMLCanvasElement>(".viewer-canvas canvas");
  if (!canvas) throw new Error("The 3D canvas is not ready.");
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Unable to capture the 3D canvas.")), "image/png"));
}
