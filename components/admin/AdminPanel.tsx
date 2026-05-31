"use client";

import { useCallback, useEffect, useState } from "react";
import { getJSON, patchJSON } from "@/lib/client";
import {
  LEAD_STATUSES,
  STREAM_META,
  EXAM_META,
  inr,
  type LeadStatus,
  type Stream,
  type Exam,
} from "@/lib/domain";

interface Stats {
  totals: {
    colleges: number;
    courses: number;
    cutoffs: number;
    users: number;
    leads: number;
    predictions: number;
  };
  leadsByStatus: Record<string, number>;
  collegesByStream: Record<string, number>;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  exam: string | null;
  rank: number | null;
  budgetMax: number | null;
  message: string | null;
  status: LeadStatus;
  createdAt: string;
}

const STATUS_TONE: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-indigo-100 text-indigo-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  ENROLLED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

export default function AdminPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");
  const [loading, setLoading] = useState(true);

  const loadLeads = useCallback(async () => {
    const q = statusFilter ? `?status=${statusFilter}` : "";
    const res = await getJSON<{ leads: Lead[] }>(`/api/admin/leads${q}`);
    if (res.success && res.data) setLeads(res.data.leads);
  }, [statusFilter]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const s = await getJSON<Stats>("/api/admin/stats");
      if (s.success && s.data) setStats(s.data);
      await loadLeads();
      setLoading(false);
    })();
  }, [loadLeads]);

  async function updateStatus(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await patchJSON(`/api/admin/leads/${id}`, { status });
    const s = await getJSON<Stats>("/api/admin/stats");
    if (s.success && s.data) setStats(s.data);
  }

  if (loading && !stats) {
    return <div className="card p-10 text-center text-slate-500">Loading dashboard…</div>;
  }

  const t = stats?.totals;

  return (
    <div className="space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { k: "Colleges", v: t?.colleges },
          { k: "Courses", v: t?.courses },
          { k: "Cutoffs", v: t?.cutoffs },
          { k: "Users", v: t?.users },
          { k: "Leads", v: t?.leads },
          { k: "Predictions", v: t?.predictions },
        ].map((c) => (
          <div key={c.k} className="card p-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {(c.v ?? 0).toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500">{c.k}</div>
          </div>
        ))}
      </div>

      {/* Stream distribution */}
      {stats && (
        <div className="card p-5">
          <h3 className="font-bold text-slate-900">Colleges by stream</h3>
          <div className="mt-4 space-y-2">
            {Object.entries(stats.collegesByStream)
              .sort((a, b) => b[1] - a[1])
              .map(([stream, count]) => {
                const max = Math.max(...Object.values(stats.collegesByStream), 1);
                return (
                  <div key={stream} className="flex items-center gap-3">
                    <div className="w-40 shrink-0 text-sm text-slate-600">
                      {STREAM_META[stream as Stream]?.icon}{" "}
                      {STREAM_META[stream as Stream]?.label ?? stream}
                    </div>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full gradient-bg"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <div className="w-16 shrink-0 text-right text-sm font-semibold text-slate-700">
                      {count.toLocaleString("en-IN")}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Leads pipeline */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900">Counselling leads</h3>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setStatusFilter("")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                statusFilter === "" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              All
            </button>
            {LEAD_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {s} ({stats?.leadsByStatus[s] ?? 0})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto scroll-thin">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Contact</th>
                <th className="px-3 py-2 font-medium">Exam / Rank</th>
                <th className="px-3 py-2 font-medium">Budget</th>
                <th className="px-3 py-2 font-medium">Message</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                    No leads in this view.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900">{l.name}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(l.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-600">
                      <div>{l.email}</div>
                      <div>{l.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {l.exam ? EXAM_META[l.exam as Exam]?.label : "—"}
                      {l.rank ? ` · ${l.rank.toLocaleString("en-IN")}` : ""}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {l.budgetMax ? inr(l.budgetMax) : "—"}
                    </td>
                    <td className="px-3 py-3 max-w-[220px] truncate text-slate-500" title={l.message ?? ""}>
                      {l.message ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={l.status}
                        onChange={(e) => updateStatus(l.id, e.target.value as LeadStatus)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium ${STATUS_TONE[l.status]}`}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
