import Link from "next/link";
import { prisma } from "@/lib/db";
import { STREAMS, STREAM_META, EXAMS, EXAM_META } from "@/lib/domain";

export const dynamic = "force-dynamic";

async function getStats() {
  const [colleges, courses, byStream] = await Promise.all([
    prisma.college.count(),
    prisma.branch.count(),
    prisma.college.groupBy({ by: ["stream"], _count: { _all: true } }),
  ]);
  const streamCount: Record<string, number> = {};
  for (const r of byStream) streamCount[r.stream] = r._count._all;
  return { colleges, courses, streamCount };
}

export default async function HomePage() {
  const { colleges, courses, streamCount } = await getStats();
  const fmt = (n: number) => n.toLocaleString("en-IN");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-bg">
        <div className="container-page relative py-20 text-center text-white sm:py-28">
          <span className="badge bg-white/15 text-white ring-1 ring-white/25">
            🎓 {fmt(colleges)}+ colleges · 7 entrance exams · 9 streams
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Find the college you{" "}
            <span className="underline decoration-fuchsia-300 decoration-4 underline-offset-4">
              actually
            </span>{" "}
            deserve.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-indigo-100">
            AI-powered admission counselling. Enter your JEE, NEET, CLAT, CAT,
            CUET, COMEDK or WBJEE rank — we predict your real chances and shortlist
            colleges by budget, location and 12th marks.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/predictor" className="btn bg-white px-6 py-3 text-indigo-700 hover:bg-indigo-50">
              🔮 Predict my college — free
            </Link>
            <Link href="/counselling" className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">
              Talk to a counsellor
            </Link>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
          {[
            { k: `${fmt(colleges)}+`, v: "Colleges" },
            { k: `${fmt(courses)}+`, v: "Courses mapped" },
            { k: "7", v: "Entrance exams" },
            { k: "9", v: "Streams" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="text-3xl font-extrabold gradient-text">{s.k}</div>
              <div className="mt-1 text-sm text-slate-500">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Streams */}
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold">Every stream, one platform</h2>
        <p className="mt-2 text-center text-slate-500">
          From IITs to AIIMS, NLUs to IIMs — explore admissions across India.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {STREAMS.map((s) => (
            <Link
              key={s}
              href={`/colleges?stream=${s}`}
              className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{STREAM_META[s].icon}</span>
                <span className="text-sm font-semibold text-slate-400 group-hover:text-indigo-600">
                  {fmt(streamCount[s] ?? 0)}
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900">{STREAM_META[s].label}</h3>
              <p className="mt-1 text-sm text-slate-500">{STREAM_META[s].tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Exams */}
      <section className="bg-white py-16">
        <div className="container-page">
          <h2 className="text-center text-3xl font-bold">Predictors for every exam</h2>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {EXAMS.map((e) => (
              <Link
                key={e}
                href={`/predictor?exam=${e}`}
                className="card flex flex-col gap-1 p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
              >
                <span className="font-bold text-slate-900">{EXAM_META[e].label}</span>
                <span className="text-xs text-slate-500">{EXAM_META[e].blurb}</span>
                <span className="mt-2 text-xs font-semibold text-indigo-600">
                  Predict →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              n: "1",
              t: "Enter your score",
              d: "Tell us your exam, rank/score, category, budget and preferred locations.",
            },
            {
              n: "2",
              t: "Get AI predictions",
              d: "Our engine compares your profile against thousands of cutoffs and ranks your best-fit colleges.",
            },
            {
              n: "3",
              t: "Counselling to lock the seat",
              d: "Get a Safe / Target / Reach shortlist and expert guidance through the counselling rounds.",
            },
          ].map((step) => (
            <div key={step.n} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-full gradient-bg font-bold text-white">
                {step.n}
              </div>
              <h3 className="mt-4 text-lg font-bold">{step.t}</h3>
              <p className="mt-1 text-sm text-slate-500">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-20">
        <div className="card gradient-bg overflow-hidden p-10 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to find your college?</h2>
          <p className="mx-auto mt-2 max-w-xl text-indigo-100">
            It takes 60 seconds. No sign-up required to see your predictions.
          </p>
          <Link
            href="/predictor"
            className="btn mt-6 bg-white px-6 py-3 text-indigo-700 hover:bg-indigo-50"
          >
            Start the predictor →
          </Link>
        </div>
      </section>
    </div>
  );
}
