import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminPanel from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Infinity Admission" };

export default function AdminPage() {
  const user = getSession();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN" && user.role !== "COUNSELLOR") redirect("/dashboard");

  return (
    <div className="container-page py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold">Admin Panel</h1>
          <p className="text-slate-500">Platform metrics & counselling pipeline.</p>
        </div>
        <span className="badge bg-indigo-100 text-indigo-700">{user.role}</span>
      </div>
      <div className="mt-8">
        <AdminPanel />
      </div>
    </div>
  );
}
