"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { ApiError, publicApiFetch } from "@/lib/api";

const schema = z.object({
  first_name: z.string().max(150).optional(),
  last_name: z.string().max(150).optional(),
  email: z.email("Enter a valid email."),
  password: z.string().min(10, "Use at least 10 characters."),
});
type Values = z.infer<typeof schema>;

export default function RegisterPage() {
  const [complete, setComplete] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async (values) => {
    try {
      await publicApiFetch("/auth/register", { method: "POST", body: JSON.stringify(values) });
      setComplete(true);
    } catch (error) {
      setError("root", { message: error instanceof ApiError ? error.message : "Unable to create your account." });
    }
  });

  if (complete) return <AuthCard eyebrow="One last step" title="Check your inbox" intro="We sent a verification link to your email. It remains valid for 24 hours."><Link className="button button-primary" href="/login">Back to sign in</Link></AuthCard>;
  return (
    <AuthCard eyebrow="Create account" title="Start planning in 3D" intro="Set up your private workspace in less than a minute.">
      <form className="form-stack" onSubmit={submit}>
        <div className="form-columns">
          <Field label="First name" error={errors.first_name?.message}><Input autoComplete="given-name" {...register("first_name")} /></Field>
          <Field label="Last name" error={errors.last_name?.message}><Input autoComplete="family-name" {...register("last_name")} /></Field>
        </div>
        <Field label="Email address" error={errors.email?.message}><Input type="email" autoComplete="email" placeholder="you@university.edu" {...register("email")} /></Field>
        <Field label="Password" error={errors.password?.message} hint="At least 10 characters; avoid common passwords."><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
        {errors.root ? <p className="form-alert">{errors.root.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</Button>
      </form>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </AuthCard>
  );
}
