"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FolderKanban, LogOut, Settings, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/ui/brand";
import { apiFetch, clearTokens, getRefreshToken } from "@/lib/api";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const ready = useAuthStore((state) => state.ready);
  const setUser = useAuthStore((state) => state.setUser);
  useNotifications(user);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, ready, router, user]);

  if (!ready || !user) return <main className="app-loading"><div className="brand-mark loading-mark"><i /><i /><i /></div><p>Preparing your workspace…</p></main>;

  const logout = async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refresh }), headers: { "Content-Type": "application/json" } });
    } finally {
      clearTokens();
      setUser(null);
      toast.success("Signed out.");
      router.replace("/login");
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand href="/dashboard" />
        <nav aria-label="Main navigation">
          <Link className={pathname.startsWith("/dashboard") || pathname.startsWith("/projects") ? "active" : ""} href="/dashboard"><FolderKanban size={18} /> Projects</Link>
          <Link className={pathname.startsWith("/settings") ? "active" : ""} href="/settings/account"><Settings size={18} /> Account</Link>
        </nav>
        <div className="sidebar-note"><Sparkles size={16} /><p><strong>Tip</strong>Use millimetres consistently for predictable layouts.</p></div>
        <button className="sidebar-user" onClick={logout} type="button">
          <span>{(user.first_name?.[0] || user.email[0]).toUpperCase()}</span>
          <i><strong>{user.first_name || "Account"}</strong><small>{user.email}</small></i>
          <LogOut size={17} />
        </button>
      </aside>
      <main className="app-main">
        {!user.is_email_verified ? <div className="verify-banner"><span>Email verification required before packing or exporting.</span><button onClick={async () => { await apiFetch("/auth/resend-verification", { method: "POST" }); toast.success("Verification email sent."); }} type="button">Resend email</button></div> : null}
        {children}
      </main>
    </div>
  );
}
