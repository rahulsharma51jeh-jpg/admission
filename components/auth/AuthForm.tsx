"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postJSON } from "@/lib/client";
import type { SessionUser } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister
      ? form
      : { email: form.email, password: form.password };
    const res = await postJSON<{ user: SessionUser }>(url, body);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || "Something went wrong.");
      return;
    }
    const role = res.data.user.role;
    router.refresh();
    router.push(role === "ADMIN" || role === "COUNSELLOR" ? "/admin" : "/dashboard");
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-7">
        <h1 className="text-2xl font-extrabold">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isRegister
            ? "Save your predictions and track your admission journey."
            : "Log in to access your dashboard."}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {isRegister && (
            <div>
              <label className="label">Full name</label>
              <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          {isRegister && (
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91…" />
            </div>
          )}
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={isRegister ? 8 : 1}
            />
            {isRegister && (
              <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
            )}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {isRegister ? (
            <>Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600">Log in</Link>
            </>
          ) : (
            <>New here?{" "}
              <Link href="/register" className="font-semibold text-indigo-600">Create an account</Link>
            </>
          )}
        </p>
      </div>

      {!isRegister && (
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo admin: admin@infinityadmission.com / Admin@12345
        </p>
      )}
    </div>
  );
}
