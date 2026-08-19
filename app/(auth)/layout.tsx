import { Brand } from "@/components/ui/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <header><Brand /></header>
      <div className="auth-grid">
        <section className="auth-aside">
          <p className="eyebrow"><span /> Pack with confidence</p>
          <h1>Turn empty space into a plan.</h1>
          <div className="auth-geometry" aria-hidden="true"><i /><i /><i /><i /></div>
          <p>Every dimension stays explicit. Every placement stays inspectable.</p>
        </section>
        <section className="auth-content">{children}</section>
      </div>
    </main>
  );
}
