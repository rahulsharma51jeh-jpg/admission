import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Sign up — Infinity Admission" };

export default function RegisterPage() {
  return (
    <div className="container-page py-16">
      <AuthForm mode="register" />
    </div>
  );
}
