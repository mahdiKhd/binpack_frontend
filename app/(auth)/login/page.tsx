"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { ApiError, publicApiFetch, setTokens } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/api";

const schema = z.object({ email: z.email("Enter a valid email."), password: z.string().min(1, "Enter your password.") });
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async (values) => {
    try {
      const result = await publicApiFetch<{ access: string; refresh: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(values) });
      setTokens(result.access, result.refresh);
      setUser(result.user);
      toast.success("Welcome back.");
      router.replace("/dashboard");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to sign in.";
      setError("root", { message });
    }
  });

  return (
    <AuthCard eyebrow="Welcome back" title="Sign in to PackLab" intro="Continue where you left your last load plan.">
      <form className="form-stack" onSubmit={submit}>
        <Field label="Email address" error={errors.email?.message}><Input type="email" autoComplete="email" placeholder="you@university.edu" {...register("email")} /></Field>
        <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="current-password" placeholder="Your password" {...register("password")} /></Field>
        <div className="form-row end"><Link className="text-link small" href="/forgot-password">Forgot password?</Link></div>
        {errors.root ? <p className="form-alert">{errors.root.message}</p> : null}
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="auth-switch">New to PackLab? <Link href="/register">Create an account</Link></p>
    </AuthCard>
  );
}
