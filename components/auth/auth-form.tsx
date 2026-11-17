"use client";

import Link from "next/link";
import { useState } from "react";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/utils";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { isReservedStudentEmail, isValidUsername, loginEmailFromIdentifier, normalizeUsername, STUDENT_PASSWORD_MIN } from "@/lib/username";
import { Logo } from "@/components/logo";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t, locale } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);
  const configured = isSupabaseConfigured();
  const demo = isDemoMode();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    const minPassword = mode === "login" ? STUDENT_PASSWORD_MIN : 8;
    if (password.length < minPassword) {
      setError(mode === "login" ? t.auth.passwordShortLogin : t.auth.passwordShort);
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError(t.auth.nameShort);
      return;
    }
    if (mode === "signup" && isReservedStudentEmail(email)) {
      setError(t.auth.reservedEmail);
      return;
    }
    if (mode === "login" && !email.trim().includes("@") && !isValidUsername(normalizeUsername(email))) {
      setError(t.auth.usernameInvalid);
      return;
    }
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError(t.auth.configMissing);
      return;
    }
    setPending(true);
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    if (mode === "signup") {
      const { data, error: signError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setPending(false);
      if (signError) {
        setError(signError.message);
        return;
      }
      if (!data.session) {
        setInfo(t.auth.checkEmail);
        return;
      }
      window.location.href = next;
      return;
    }
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: loginEmailFromIdentifier(email),
      password,
    });
    setPending(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    void fetch("/api/activity/login", { method: "POST" }).catch(() => undefined);
    window.location.href = next;
  }

  async function google() {
    const supabase = createBrowserSupabase();
    if (!supabase) {
      setError(t.auth.configMissing);
      return;
    }
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="mb-8 w-fit">
        <Logo locale={locale} />
      </Link>
      <h1 className="text-3xl font-semibold">{mode === "login" ? t.auth.loginTitle : t.auth.signupTitle}</h1>
      <p className="mt-2 text-sm text-muted">{mode === "login" ? t.auth.loginLead : t.auth.signupLead}</p>
      {!configured ? <p className="mt-4 rounded-lg border border-secondary/40 bg-secondary/10 p-3 text-sm">{t.auth.configMissing}</p> : null}
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3">
        {mode === "signup" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.auth.name}</span>
            <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{mode === "login" ? t.auth.identifier : t.auth.email}</span>
          <Input
            type={mode === "login" ? "text" : "email"}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete={mode === "login" ? "username" : "email"}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            dir="ltr"
            className="text-left"
            placeholder={mode === "login" ? t.auth.identifierPlaceholder : undefined}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted">{t.auth.password}</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            dir="ltr"
            className="text-left"
            required
          />
        </label>
        {error ? <p className="text-sm text-secondary">{error}</p> : null}
        {info ? <p className="text-sm text-primary">{info}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t.common.loading : mode === "login" ? t.auth.submitLogin : t.auth.submitSignup}
        </Button>
      </form>
      <div className="my-4 text-center text-xs text-muted">{t.auth.or}</div>
      <Button type="button" variant="outline" className="w-full" onClick={google} disabled={!configured}>
        {t.auth.google}
      </Button>
      <p className="mt-6 text-sm text-muted">
        {mode === "login" ? t.auth.noAccount : t.auth.hasAccount}{" "}
        <Link href={mode === "login" ? "/signup" : "/login"} className="text-primary">
          {mode === "login" ? t.auth.create : t.auth.enter}
        </Link>
      </p>
      {demo ? (
        <Link href="/dashboard" className="mt-4 text-sm text-primary">
          {t.auth.demoLink}
        </Link>
      ) : null}
    </div>
  );
}
