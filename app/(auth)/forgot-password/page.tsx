"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { publicApiFetch } from "@/lib/api";

const schema = z.object({ email: z.email("Enter a valid email.") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (values) => {
    await publicApiFetch("/auth/password/reset", { method: "POST", body: JSON.stringify(values) });
    setSent(true);
  });
  return (
    <AuthCard eyebrow="Password recovery" title={sent ? "Check your inbox" : "Reset your password"} intro={sent ? "If an account matches that email, a reset link is on its way." : "Enter your account email and we’ll send a one-hour reset link."}>
      {sent ? <Link className="button button-primary" href="/login">Return to sign in</Link> : (
        <form className="form-stack" onSubmit={submit}>
          <Field label="Email address" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
      <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
    </AuthCard>
  );
}
