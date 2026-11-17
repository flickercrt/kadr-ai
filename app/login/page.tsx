import { AuthForm } from "@/components/auth/auth-form";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "دخول",
  description: "ادخل إلى حسابك في أكاديمية كادر.",
  path: "/login",
});

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
