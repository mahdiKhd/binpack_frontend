"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-field";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/api";

export default function AccountPage() {
  const user = useAuthStore((state) => state.user)!;
  const setUser = useAuthStore((state) => state.setUser);
  const profile = useForm<{ first_name: string; last_name: string }>({ defaultValues: { first_name: user.first_name, last_name: user.last_name } });
  const password = useForm<{ current_password: string; new_password: string }>();

  return <div className="settings-page page-pad"><header className="page-header"><div><p className="eyebrow"><span /> Account settings</p><h1>Your profile.</h1><p>Manage how PackLab identifies you and secure your account.</p></div></header><div className="settings-grid"><section className="panel"><p className="micro-label">Profile</p><h2>Personal details</h2><form className="form-stack" onSubmit={profile.handleSubmit(async (values) => { try { const updated = await apiFetch<User>("/auth/me", { method: "PATCH", body: JSON.stringify(values), headers: { "Content-Type": "application/json" } }); setUser(updated); toast.success("Profile updated."); } catch (error) { profile.setError("root", { message: error instanceof ApiError ? error.message : "Unable to update profile." }); } })}><div className="form-columns"><Field label="First name"><Input {...profile.register("first_name")} /></Field><Field label="Last name"><Input {...profile.register("last_name")} /></Field></div><Field label="Email address" hint="Email changes are not available in the MVP."><Input value={user.email} disabled /></Field>{profile.formState.errors.root ? <p className="form-alert">{profile.formState.errors.root.message}</p> : null}<Button type="submit" disabled={profile.formState.isSubmitting}>Save details</Button></form></section><section className="panel"><p className="micro-label">Security</p><h2>Change password</h2><form className="form-stack" onSubmit={password.handleSubmit(async (values) => { try { await apiFetch("/auth/password/change", { method: "POST", body: JSON.stringify(values), headers: { "Content-Type": "application/json" } }); password.reset(); toast.success("Password changed. Sign in again on your next session."); } catch (error) { password.setError("root", { message: error instanceof ApiError ? error.message : "Unable to change password." }); } })}><Field label="Current password"><Input type="password" autoComplete="current-password" {...password.register("current_password", { required: true })} /></Field><Field label="New password" hint="Use at least 10 characters."><Input type="password" autoComplete="new-password" {...password.register("new_password", { required: true, minLength: 10 })} /></Field>{password.formState.errors.root ? <p className="form-alert">{password.formState.errors.root.message}</p> : null}<Button type="submit" disabled={password.formState.isSubmitting}>Update password</Button></form></section></div></div>;
}
