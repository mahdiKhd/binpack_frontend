"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { ApiError, publicApiFetch } from "@/lib/api";

const schema = z.object({ password: z.string().min(10, "Use at least 10 characters."), confirm: z.string() }).refine((value) => value.password === value.confirm, { path: ["confirm"], message: "Passwords do not match." });
type Values = z.infer<typeof schema>;

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [complete, setComplete] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (values) => {
    if (!token) return setError("root", { message: "The reset token is missing." });
    try {
      await publicApiFetch("/auth/password/reset/confirm", { method: "POST", body: JSON.stringify({ token, new_password: values.password }) });
      setComplete(true);
    } catch (error) {
      setError("root", { message: error instanceof ApiError ? error.message : "Unable to reset the password." });
    }
  });
  if (complete) return <AuthCard eyebrow="Password updated" title="You’re ready to return" intro="Your password was changed and existing sessions were signed out."><Link className="button button-primary" href="/login">Sign in</Link></AuthCard>;
  return <AuthCard eyebrow="Choose a password" title="Set a new password" intro="Use a strong password you do not reuse elsewhere."><form className="form-stack" onSubmit={submit}><Field label="New password" error={errors.password?.message}><Input type="password" autoComplete="new-password" {...register("password")} /></Field><Field label="Confirm password" error={errors.confirm?.message}><Input type="password" autoComplete="new-password" {...register("confirm")} /></Field>{errors.root ? <p className="form-alert">{errors.root.message}</p> : null}<Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Update password"}</Button></form></AuthCard>;
}

export default function ResetPasswordPage() { return <Suspense><ResetForm /></Suspense>; }
