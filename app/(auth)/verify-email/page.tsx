"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { ApiError, publicApiFetch } from "@/lib/api";

function Verify() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState<"working" | "done" | "error">(token ? "working" : "error");
  const [message, setMessage] = useState(token ? "Confirming your email address…" : "The verification token is missing.");
  useEffect(() => {
    if (!token) return;
    publicApiFetch("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) })
      .then(() => { setState("done"); setMessage("Your email is verified. You can now run packing jobs and create exports."); })
      .catch((error) => { setState("error"); setMessage(error instanceof ApiError ? error.message : "This verification link is invalid or expired."); });
  }, [token]);
  return <AuthCard eyebrow="Email verification" title={state === "working" ? "Checking your link" : state === "done" ? "Email verified" : "Link not accepted"} intro={message}>{state !== "working" ? <Link className="button button-primary" href="/login">Continue to sign in</Link> : <div className="loader-line"><i /></div>}</AuthCard>;
}

export default function VerifyEmailPage() { return <Suspense><Verify /></Suspense>; }
