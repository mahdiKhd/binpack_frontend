import { Boxes, Gauge, Scale } from "lucide-react";
import type { Metrics } from "@/types/api";

export function MetricsPanel({ metrics }: { metrics: Metrics }) {
  return (
    <div className="metrics-strip">
      <div><Gauge size={17} /><span>Volume</span><strong>{metrics.volume_utilization_pct.toFixed(1)}%</strong></div>
      <div><Boxes size={17} /><span>Packed</span><strong>{metrics.packed_count}<small> / {metrics.packed_count + metrics.unplaced_count}</small></strong></div>
      <div><Scale size={17} /><span>Weight</span><strong>{metrics.total_weight_kg.toFixed(1)}<small> kg</small></strong></div>
      <i className="metric-progress"><b style={{ width: `${Math.min(100, metrics.volume_utilization_pct)}%` }} /></i>
    </div>
  );
}
