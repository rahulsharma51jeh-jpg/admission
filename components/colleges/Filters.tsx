"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  STREAMS,
  STREAM_META,
  EXAMS,
  EXAM_META,
  COLLEGE_TYPES,
  INDIAN_STATES,
} from "@/lib/domain";

export default function Filters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  // keep local search box in sync if the URL changes externally
  useEffect(() => {
    setQ(sp.get("q") ?? "");
  }, [sp]);

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    params.delete("page"); // reset pagination on filter change
    router.push(`/colleges?${params.toString()}`);
  }

  const current = (k: string) => sp.get(k) ?? "";

  return (
    <div className="card sticky top-20 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q || undefined });
        }}
      >
        <label className="label">Search</label>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Name or city…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="btn-primary" type="submit">Go</button>
        </div>
      </form>

      <div className="mt-4">
        <label className="label">Stream</label>
        <select className="input" value={current("stream")} onChange={(e) => update({ stream: e.target.value || undefined })}>
          <option value="">All streams</option>
          {STREAMS.map((s) => (
            <option key={s} value={s}>{STREAM_META[s].label}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="label">State</label>
        <select className="input" value={current("state")} onChange={(e) => update({ state: e.target.value || undefined })}>
          <option value="">All states</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="label">Type</label>
        <select className="input" value={current("type")} onChange={(e) => update({ type: e.target.value || undefined })}>
          <option value="">All types</option>
          {COLLEGE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="label">Accepts exam</label>
        <select className="input" value={current("exam")} onChange={(e) => update({ exam: e.target.value || undefined })}>
          <option value="">Any exam</option>
          {EXAMS.map((e) => (
            <option key={e} value={e}>{EXAM_META[e].label}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="label">Sort by</label>
        <select className="input" value={current("sort")} onChange={(e) => update({ sort: e.target.value || undefined })}>
          <option value="nirf">Ranking (NIRF)</option>
          <option value="feesAsc">Fees: low to high</option>
          <option value="feesDesc">Fees: high to low</option>
          <option value="name">Name (A–Z)</option>
        </select>
      </div>

      <button
        onClick={() => router.push("/colleges")}
        className="btn-ghost mt-4 w-full"
        type="button"
      >
        Clear all filters
      </button>
    </div>
  );
}
