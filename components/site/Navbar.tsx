"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";

const LINKS = [
  { href: "/predictor", label: "College Predictor" },
  { href: "/colleges", label: "Explore Colleges" },
  { href: "/counselling", label: "AI Counselling" },
];

export default function Navbar({ user }: { user: SessionUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg gradient-bg text-lg font-black text-white">
            ∞
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Infinity<span className="gradient-text">Admission</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === "ADMIN" || user.role === "COUNSELLOR" ? (
                <Link href="/admin" className="btn-ghost">
                  Admin
                </Link>
              ) : (
                <Link href="/dashboard" className="btn-ghost">
                  Dashboard
                </Link>
              )}
              <span className="text-sm text-slate-500">Hi, {user.name.split(" ")[0]}</span>
              <button onClick={logout} className="btn-secondary">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/predictor" className="btn-primary">
                Predict my college
              </Link>
            </>
          )}
        </div>

        <button
          className="btn-ghost md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link
                    href={user.role === "STUDENT" ? "/dashboard" : "/admin"}
                    className="btn-secondary flex-1"
                    onClick={() => setOpen(false)}
                  >
                    {user.role === "STUDENT" ? "Dashboard" : "Admin"}
                  </Link>
                  <button onClick={logout} className="btn-secondary flex-1">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-secondary flex-1" onClick={() => setOpen(false)}>
                    Log in
                  </Link>
                  <Link href="/predictor" className="btn-primary flex-1" onClick={() => setOpen(false)}>
                    Predict
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
