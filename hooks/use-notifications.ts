"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAccessToken, WS_URL } from "@/lib/api";
import type { User } from "@/types/api";

export function useNotifications(user: User | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user || !getAccessToken()) return;
    let socket: WebSocket | null = null;
    let reconnect: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      const token = getAccessToken();
      if (!token) return;
      socket = new WebSocket(`${WS_URL}${WS_URL.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`);
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as { event: string; payload: { job_id?: string; status?: string; layout_id?: string } };
          if (message.event !== "packing_job.updated") return;
          if (message.payload.job_id) void queryClient.invalidateQueries({ queryKey: ["packing-job", message.payload.job_id] });
          void queryClient.invalidateQueries({ queryKey: ["layouts"] });
          if (message.payload.status === "succeeded") toast.success("Packing complete", { description: "The new layout is ready to inspect." });
          if (message.payload.status === "failed") toast.error("Packing job failed");
        } catch {
          // Ignore malformed socket events and retain polling fallback.
        }
      };
      socket.onclose = () => {
        if (!stopped) reconnect = setTimeout(connect, 4000);
      };
    };
    connect();
    return () => {
      stopped = true;
      if (reconnect) clearTimeout(reconnect);
      socket?.close();
    };
  }, [queryClient, user]);
}
