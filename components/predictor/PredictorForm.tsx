"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  EXAMS,
  EXAM_META,
  CATEGORIES,
  GENDERS,
  INDIAN_STATES,
  CHANCE_META,
  type Exam,
  type Category,
  type Gender,
  type Chance,
} from "@/lib/domain";
import { postJSON } from "@/lib/client";
import type { PredictionResultDTO } from "@/lib/types";
import MatchCard from "@/components/predictor/MatchCard";

const CHANCE_ORDER: Chance[] = ["AMBITIOUS", "REACH", "TARGET", "SAFE"];

export default function PredictorForm({ initialExam }: { initialExam?: Exam }) {
  const [step, setStep] = useState(1);
  const [exam, setExam] = useState<Exam>(initialExam ?? "JEE_MAIN");
  const [rank, setRank] = useState("");
  const [score, setScore] = useState("");
  const [category, setCategory] = useState<Category>("GENERAL");
  const [gender, setGender] = useState<Gender>("ALL");
  const [budgetMax, setBudgetMax] = useState("");
  const [twelfthPct, setTwelfthPct] = useState("");
  const [preferredStates, setPreferredStates] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResultDTO | null>(null);
  const [filter, setFilter] = useState<Chance | "ALL">("ALL");

  const meta = EXAM_META[exam];
  const isScore = meta.metric === "score";

  const toggleState = (s: string) =>
    setPreferredStates((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const canSubmit = isScore ? !!score : !!rank;

  async function submit() {
    setError(null);
    if (!canSubmit) {
      setError(isScore ? "Please enter your score." : "Please enter your rank.");
      return;
    }
    setLoading(true);
    const payload = {
      exam,
      rank: isScore ? undefined : Number(rank),
      score: isScore ? Number(score) : undefined,
      category,
      gender,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      twelfthPct: twelfthPct ? Number(twelfthPct) : undefined,
      preferredStates,
      save: true,
    };
    const res = await postJSON<PredictionResultDTO>("/api/predict", payload);
    setLoading(false);
    if (!res.success || !res.data) {
      setError(res.error || "Could not generate predictions.");
      return;
    }
    setResult(res.data);
    setStep(4);
  }

  const filteredMatches = useMemo(() => {
    if (!result) return [];
    if (filter === "ALL") return result.matches;
    return result.matches.filter((m) => m.chance === filter);
  }, [result, filter]);

  function reset() {
    setResult(null);
    setStep(1);
    setFilter("ALL");
  }

  // ---------- Results view ----------
  if (step === 4 && result) {
    return (
      <div className="space-y-6">
        <div className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Your {EXAM_META[exam].label} predictions
              </h2>
              <p className="text-sm text-slate-500">
                {result.totalMatches} best-fit colleges ·{" "}
                {isScore ? `Score ${score}` : `Rank ${Number(rank).toLocaleString("en-IN")}`} ·{" "}
                {category}
                {result.saved ? " · saved to your dashboard" : ""}
              </p>
            </div>
            <button onClick={reset} className="btn-secondary">
              ← New prediction
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CHANCE_ORDER.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(filter === c ? "ALL" : c)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  filter === c ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="text-2xl font-extrabold text-slate-900">
                  {result.summary[c] ?? 0}
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {CHANCE_META[c].label}
                </div>
              </button>
            ))}
          </div>
          {filter !== "ALL" && (
            <p className="mt-3 text-xs text-slate-500">
              {CHANCE_META[filter].description}{" "}
              <button onClick={() => setFilter("ALL")} className="font-semibold text-indigo-600">
                Show all
              </button>
            </p>
          )}
        </div>

        {result.totalMatches === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-slate-600">
              No colleges matched within your budget for this profile. Try raising
              your budget or removing filters.
            </p>
            <Link href="/counselling" className="btn-primary mt-4">
              Get personalised counselling
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredMatches.map((m) => (
              <MatchCard key={m.branchId} m={m} />
            ))}
          </div>
        )}

        <div className="card gradient-bg p-6 text-center text-white">
          <h3 className="text-lg font-bold">Want an expert to lock your seat?</h3>
          <p className="mt-1 text-sm text-indigo-100">
            Our counsellors plan your choice-filling across every round.
          </p>
          <Link href="/counselling" className="btn mt-4 bg-white text-indigo-700 hover:bg-indigo-50">
            Book free counselling
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Wizard ----------
  return (
    <div className="card overflow-hidden">
      {/* progress */}
      <div className="flex border-b border-slate-200">
        {["Exam", "Score", "Preferences"].map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n;
          return (
            <div
              key={label}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium ${
                active ? "bg-indigo-50 text-indigo-700" : done ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                  active ? "bg-indigo-600 text-white" : done ? "bg-emerald-500 text-white" : "bg-slate-200"
                }`}
              >
                {done ? "✓" : n}
              </span>
              {label}
            </div>
          );
        })}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold">Which entrance exam did you take?</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {EXAMS.map((e) => (
                <button
                  key={e}
                  onClick={() => setExam(e)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    exam === e ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-900">{EXAM_META[e].label}</div>
                  <div className="text-xs text-slate-500">{EXAM_META[e].blurb}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setStep(2)} className="btn-primary">
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-bold">
              Your {EXAM_META[exam].label} result
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">
                  {isScore ? `Your ${meta.unit}` : `Your ${meta.unit}`}
                </label>
                {isScore ? (
                  <input
                    type="number"
                    className="input"
                    placeholder={`e.g. ${Math.round(meta.max * 0.85)}`}
                    value={score}
                    min={0}
                    max={meta.max}
                    onChange={(e) => setScore(e.target.value)}
                  />
                ) : (
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g. 12500"
                    value={rank}
                    min={1}
                    onChange={(e) => setRank(e.target.value)}
                  />
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Max {meta.metric === "rank" ? "rank" : "value"}: {meta.max.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Gender (for gender-neutral / female seats)</label>
                <select
                  className="input"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g === "ALL" ? "All / Gender-neutral" : "Female"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Class 12 aggregate %  (optional)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="e.g. 88"
                  value={twelfthPct}
                  min={0}
                  max={100}
                  onChange={(e) => setTwelfthPct(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
              <button onClick={() => setStep(3)} className="btn-primary">Continue →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-lg font-bold">Budget & location preferences</h2>
            <div className="mt-4">
              <label className="label">Maximum annual fee budget (₹, optional)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 200000"
                value={budgetMax}
                min={0}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Colleges above this annual tuition will be filtered out.
              </p>
            </div>

            <div className="mt-4">
              <label className="label">
                Preferred states (optional) — boosts matching colleges
              </label>
              <div className="scroll-thin flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3">
                {INDIAN_STATES.map((s) => {
                  const on = preferredStates.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleState(s)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        on ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
              <button onClick={submit} disabled={loading} className="btn-primary">
                {loading ? "Predicting…" : "🔮 Predict my colleges"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
