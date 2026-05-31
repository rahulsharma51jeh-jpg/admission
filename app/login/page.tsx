import AuthForm from "@/components/auth/AuthForm";

export const metadata = { title: "Log in — Infinity Admission" };

export default function LoginPage() {
  return (
    <div className="container-page py-16">
      <AuthForm mode="login" />
    </div>
  );
}
