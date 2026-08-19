"use client";

import { Edges, GizmoHelper, GizmoViewport, Grid, Html, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildBoxTypeColorMap } from "@/lib/box-colors";
import { isValidPlacement } from "@/lib/geometry";
import { placementKey } from "@/stores/editor-store";
import type { BoxType, Container, Placement } from "@/types/api";

const UNIT = 1000;

function ContainerMesh({ container }: { container: Container }) {
  const size: [number, number, number] = [container.length_mm / UNIT, container.height_mm / UNIT, container.width_mm / UNIT];
  return (
    <mesh position={[size[0] / 2, size[1] / 2, size[2] / 2]}>
      <boxGeometry args={size} />
      <meshBasicMaterial color="#8ca0b8" transparent opacity={0.035} depthWrite={false} />
      <Edges color="#718096" linewidth={1.2} />
    </mesh>
  );
}

interface BoxMeshProps {
  placement: Placement;
  box: BoxType | undefined;
  displayColor: string;
  placements: Placement[];
  container: Container;
  selected: boolean;
  editable: boolean;
  onSelect: () => void;
  onMove?: (placement: Placement) => void;
}

function BoxMesh({ placement, box, displayColor, placements, container, selected, editable, onSelect, onMove }: BoxMeshProps) {
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState<Placement | null>(null);
  const dragging = useRef(false);
  const latestDraft = useRef<Placement | null>(null);
  const shown = draft ?? placement;
  const valid = !draft || isValidPlacement(draft, placements.filter((item) => placementKey(item) !== placementKey(placement)), container);
  const size: [number, number, number] = [shown.size_mm.length / UNIT, shown.size_mm.height / UNIT, shown.size_mm.width / UNIT];
  const position: [number, number, number] = [
    (shown.position_mm.x + shown.size_mm.length / 2) / UNIT,
    (shown.position_mm.z + shown.size_mm.height / 2) / UNIT,
    (shown.position_mm.y + shown.size_mm.width / 2) / UNIT,
  ];

  const pointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onSelect();
    if (!editable) return;
    dragging.current = true;
    (event.target as Element).setPointerCapture?.(event.pointerId);
  };

  const pointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current || !editable) return;
    event.stopPropagation();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -placement.position_mm.z / UNIT);
    const point = new THREE.Vector3();
    if (!event.ray.intersectPlane(plane, point)) return;
    const next: Placement = {
      ...placement,
      position_mm: {
        x: Math.round(point.x * UNIT - placement.size_mm.length / 2),
        y: Math.round(point.z * UNIT - placement.size_mm.width / 2),
        z: placement.position_mm.z,
      },
    };
    latestDraft.current = next;
    setDraft(next);
  };

  const pointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!dragging.current) return;
    event.stopPropagation();
    dragging.current = false;
    const next = latestDraft.current;
    if (next && isValidPlacement(next, placements.filter((item) => placementKey(item) !== placementKey(placement)), container)) onMove?.(next);
    latestDraft.current = null;
    setDraft(null);
    (event.target as Element).releasePointerCapture?.(event.pointerId);
  };

  return (
    <mesh
      position={position}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial color={!valid ? "#ef4444" : displayColor} roughness={0.72} metalness={0.02} emissive={selected ? "#2537d7" : "#000000"} emissiveIntensity={selected ? 0.16 : 0} transparent opacity={draft ? 0.72 : 1} />
      <Edges color={selected ? "#e8ff5b" : hovered ? "#ffffff" : "#1b2440"} linewidth={selected ? 2 : 0.7} />
      {hovered ? <Html center position={[0, size[1] / 2 + 0.13, 0]} className="scene-label"><strong>{box?.label ?? "Box"}</strong><span>#{placement.instance_index + 1}</span></Html> : null}
    </mesh>
  );
}

export interface PackingSceneProps {
  container: Container;
  boxes: BoxType[];
  placements: Placement[];
  selectedKey?: string | null;
  editable?: boolean;
  onSelect?: (key: string | null) => void;
  onMove?: (placement: Placement) => void;
}

export default function PackingScene({ container, boxes, placements, selectedKey, editable = false, onSelect, onMove }: PackingSceneProps) {
  const boxMap = useMemo(() => new Map(boxes.map((box) => [box.id, box])), [boxes]);
  const colorMap = useMemo(() => buildBoxTypeColorMap(boxes), [boxes]);
  const maxDimension = Math.max(container.length_mm, container.width_mm) / UNIT;
  const target: [number, number, number] = [container.length_mm / UNIT / 2, container.height_mm / UNIT / 3, container.width_mm / UNIT / 2];
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ fov: 42, position: [maxDimension * 1.35, maxDimension * 1.05, maxDimension * 1.35], near: Math.max(0.01, maxDimension / 1000), far: maxDimension * 20 }}
      onPointerMissed={() => onSelect?.(null)}
      dpr={[1, 1.75]}
    >
      <color attach="background" args={["#eef1f4"]} />
      <fog attach="fog" args={["#eef1f4", maxDimension * 3.5, maxDimension * 9]} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[8, 12, 7]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
      <Grid args={[maxDimension * 1.45, Math.min(80, Math.max(12, Math.round(maxDimension * 10)))]} position={[container.length_mm / UNIT / 2, -0.002, container.width_mm / UNIT / 2]} cellColor="#b8c0cc" sectionColor="#7b8797" fadeDistance={maxDimension * 3} infiniteGrid={false} />
      <ContainerMesh container={container} />
      {placements.map((placement) => (
        <BoxMesh
          key={placementKey(placement)}
          placement={placement}
          box={boxMap.get(placement.box_id)}
          displayColor={colorMap.get(placement.box_id) ?? "#5b6cff"}
          placements={placements}
          container={container}
          selected={selectedKey === placementKey(placement)}
          editable={editable}
          onSelect={() => onSelect?.(placementKey(placement))}
          onMove={onMove}
        />
      ))}
      <OrbitControls makeDefault target={target} enableDamping dampingFactor={0.08} minDistance={0.4} maxDistance={maxDimension * 8} />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}><GizmoViewport axisColors={["#e45454", "#61a068", "#536df0"]} labelColor="#111827" /></GizmoHelper>
    </Canvas>
  );
}
