import Link from "next/link";
import { ArrowRight, Box, Gauge, Layers3 } from "lucide-react";
import { Brand } from "@/components/ui/brand";

export default function HomePage() {
  return (
    <main className="landing">
      <nav className="landing-nav page-width">
        <Brand />
        <div className="nav-actions">
          <Link className="text-link" href="/login">Sign in</Link>
          <Link className="button button-primary" href="/register">Start packing <ArrowRight size={16} /></Link>
        </div>
      </nav>

      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Spatial planning, made tangible</p>
          <h1>Fit more.<br /><em>See why.</em></h1>
          <p className="hero-lede">
            Model containers, compare deterministic packing strategies, and refine every placement in an interactive 3D workspace.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/register">Create a project <ArrowRight size={18} /></Link>
            <a className="button button-secondary button-large" href="#workflow">Explore workflow</a>
          </div>
          <div className="hero-proof">
            <span><strong>6</strong> orientations</span>
            <span><strong>2</strong> heuristics</span>
            <span><strong>1</strong> clear view</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Stylized three-dimensional packing preview">
          <div className="visual-toolbar"><i /><i /><i /><span>LOAD / 0027</span></div>
          <div className="visual-stage">
            <div className="axis axis-x">X</div><div className="axis axis-y">Y</div><div className="axis axis-z">Z</div>
            <div className="wire-container">
              <div className="demo-box box-one" /><div className="demo-box box-two" /><div className="demo-box box-three" />
              <div className="demo-box box-four" /><div className="demo-box box-five" />
            </div>
            <div className="util-chip"><span>Volume used</span><strong>78.4%</strong><i><b /></i></div>
          </div>
          <div className="visual-footer"><span>FFD · EXTREME POINT</span><span className="live-dot">VALID LAYOUT</span></div>
        </div>
      </section>

      <section className="workflow page-width" id="workflow">
        <div className="section-heading"><p className="eyebrow"><span /> The workflow</p><h2>From dimensions to decisions.</h2></div>
        <div className="feature-grid">
          <article><span className="feature-number">01</span><Box /><h3>Define the load</h3><p>Set usable container dimensions, weight capacity, and reusable box types in millimetres and kilograms.</p></article>
          <article><span className="feature-number">02</span><Gauge /><h3>Run the solver</h3><p>Compare fast shelf packing with an extreme-point heuristic. Jobs run asynchronously while you keep working.</p></article>
          <article><span className="feature-number">03</span><Layers3 /><h3>Inspect and refine</h3><p>Orbit the result, move and rotate individual boxes, validate collisions, save layouts, and export the plan.</p></article>
        </div>
      </section>
      <footer className="landing-footer page-width"><Brand /><p>Built for spatial clarity.</p><span>3D BIN PACKING / 2026</span></footer>
    </main>
  );
}
