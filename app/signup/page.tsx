import { AuthForm } from "@/components/auth/auth-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "حساب جديد",
  description: "أنشئ حساباً في أكاديمية كادر وابدأ العضوية الشهرية.",
  path: "/signup",
});

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
