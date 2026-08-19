"use client";

import { useEffect } from "react";
import { apiFetch, hasRefreshToken } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/api";

export function AuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const setReady = useAuthStore((state) => state.setReady);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      if (!hasRefreshToken()) {
        if (active) setReady(true);
        return;
      }
      try {
        const user = await apiFetch<User>("/auth/me");
        if (active) setUser(user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    };
    void initialize();
    const expired = () => {
      setUser(null);
      setReady(true);
    };
    window.addEventListener("packlab:auth-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("packlab:auth-expired", expired);
    };
  }, [setReady, setUser]);

  return null;
}
