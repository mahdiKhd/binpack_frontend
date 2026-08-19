export function AuthCard({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="auth-card">
      <p className="micro-label">{eyebrow}</p>
      <h2>{title}</h2>
      <p className="auth-intro">{intro}</p>
      {children}
    </div>
  );
}
