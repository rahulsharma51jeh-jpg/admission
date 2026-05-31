"use client";

import { useState } from "react";
import { EXAMS, EXAM_META, type Exam } from "@/lib/domain";
import { postJSON } from "@/lib/client";

export default function LeadForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    exam: "" as "" | Exam,
    rank: "",
    budgetMax: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.phone) {
      setError("Name, email and phone are required.");
      return;
    }
    setLoading(true);
    const res = await postJSON<{ leadId: string }>("/api/leads", {
      name: form.name,
      email: form.email,
      phone: form.phone,
      exam: form.exam || undefined,
      rank: form.rank ? Number(form.rank) : undefined,
      budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
      message: form.message || undefined,
      source: "counselling-page",
    });
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Could not submit. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl">
          ✓
        </div>
        <h3 className="mt-4 text-xl font-bold">Request received!</h3>
        <p className="mt-2 text-slate-500">
          One of our counsellors will reach out to {form.email} within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6">
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Full name *</label>
          <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91…" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email *</label>
          <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className="label">Exam</label>
          <select className="input" value={form.exam} onChange={(e) => set("exam", e.target.value)}>
            <option value="">Select…</option>
            {EXAMS.map((ex) => (
              <option key={ex} value={ex}>{EXAM_META[ex].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Rank / score</label>
          <input type="number" className="input" value={form.rank} onChange={(e) => set("rank", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Max budget (₹/yr)</label>
          <input type="number" className="input" value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">What do you need help with?</label>
          <textarea
            className="input min-h-[90px]"
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="e.g. Shortlisting CSE colleges within my budget…"
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary mt-5 w-full">
        {loading ? "Submitting…" : "Request free counselling"}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">
        We respect your privacy. No spam, ever.
      </p>
    </form>
  );
}
