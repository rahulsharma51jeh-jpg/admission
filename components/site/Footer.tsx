import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-bg font-black text-white">
              ∞
            </span>
            <span className="text-lg font-extrabold">
              Infinity<span className="gradient-text">Admission</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            AI-powered college admission counselling. Predict your college across
            JEE, NEET, CLAT, CAT, CUET, COMEDK & WBJEE — then get expert guidance
            to lock in your seat.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/predictor" className="hover:text-indigo-600">College Predictor</Link></li>
            <li><Link href="/colleges" className="hover:text-indigo-600">Explore Colleges</Link></li>
            <li><Link href="/counselling" className="hover:text-indigo-600">AI Counselling</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/login" className="hover:text-indigo-600">Log in</Link></li>
            <li><Link href="/register" className="hover:text-indigo-600">Sign up</Link></li>
            <li><Link href="/dashboard" className="hover:text-indigo-600">My Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Infinity Admission. Built as a demo MVP.</p>
          <p>Predictions are indicative — verify with official counselling bodies.</p>
        </div>
      </div>
    </footer>
  );
}
