import LeadForm from "@/components/counselling/LeadForm";

export const metadata = {
  title: "AI Admission Counselling — Infinity Admission",
  description:
    "Get expert, AI-assisted admission counselling. We plan your choice-filling across JEE, NEET, CLAT, CAT, CUET, COMEDK and WBJEE counselling rounds.",
};

const PERKS = [
  { icon: "🎯", t: "Personalised college list", d: "A Safe / Target / Reach plan built around your rank, budget and goals." },
  { icon: "🗳️", t: "Choice-filling strategy", d: "Round-by-round guidance for JoSAA, MCC, CLAT, CAT & state counselling." },
  { icon: "💰", t: "Budget & scholarship help", d: "Find the best ROI colleges and applicable fee waivers." },
  { icon: "🧑‍🏫", t: "1:1 expert mentors", d: "Talk to counsellors who've guided thousands of admissions." },
];

export default function CounsellingPage() {
  return (
    <div className="container-page py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <span className="badge bg-indigo-100 text-indigo-700">AI + Human counselling</span>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Don&apos;t just predict — <span className="gradient-text">get in.</span>
          </h1>
          <p className="mt-3 text-slate-600">
            Our predictor shows your chances. Our counsellors make sure you convert
            them into an admission. Book a free consultation and we&apos;ll build your
            personalised admission roadmap.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PERKS.map((p) => (
              <div key={p.t} className="card p-4">
                <div className="text-2xl">{p.icon}</div>
                <h3 className="mt-2 font-bold text-slate-900">{p.t}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <LeadForm />
        </div>
      </div>
    </div>
  );
}
