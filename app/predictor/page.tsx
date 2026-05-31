import PredictorForm from "@/components/predictor/PredictorForm";
import { EXAMS, type Exam } from "@/lib/domain";

export const metadata = {
  title: "College Predictor — Infinity Admission",
  description:
    "Predict your college from your JEE, NEET, CLAT, CAT, CUET, COMEDK or WBJEE rank, filtered by budget, location and 12th marks.",
};

export default function PredictorPage({
  searchParams,
}: {
  searchParams: { exam?: string };
}) {
  const initialExam = EXAMS.includes(searchParams.exam as Exam)
    ? (searchParams.exam as Exam)
    : undefined;

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            AI College <span className="gradient-text">Predictor</span>
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-500">
            Enter your details and get a Safe / Target / Reach shortlist in seconds.
            No sign-up required.
          </p>
        </div>
        <div className="mt-8">
          <PredictorForm initialExam={initialExam} />
        </div>
      </div>
    </div>
  );
}
