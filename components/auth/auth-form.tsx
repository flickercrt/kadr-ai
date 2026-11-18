"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { followLogin, WHATSAPP_DEVICES, writeRememberCookie } from "@/lib/auth-cookies";
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
  const [remember, setRemember] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const configured = isSupabaseConfigured();
  const demo = isDemoMode();

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    const id = window.setTimeout(() => {
      if (reason === "devices") {
        setBlocked(true);
        setError(t.devices.limit);
      } else if (reason === "revoked" || reason === "device") {
        setInfo(t.devices.signedOut);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [t.devices.limit, t.devices.signedOut]);

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
    const keep = mode === "login" ? remember : true;
    writeRememberCookie(keep);
    const supabase = createBrowserSupabase(keep);
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
      const allowed = await claimDevice(remember);
      if (!allowed) return;
      followLogin(next);
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
    const allowed = await claimDevice(remember);
    if (!allowed) return;
    followLogin(next);
  }

  async function claimDevice(keep: boolean) {
    try {
      const response = await fetch("/api/devices/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remember: keep }),
      });
      const data = (await response.json().catch(() => ({}))) as { code?: string; message?: string };
      if (response.status === 403 && data.code === "device_limit") {
        setBlocked(true);
        setError(data.message || t.devices.limit);
        return false;
      }
    } catch {
      // A failed device write must not trap a successful login.
    }
    return true;
  }

  async function google() {
    writeRememberCookie(true);
    const supabase = createBrowserSupabase(true);
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
        {mode === "login" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 accent-[#00D4B4]"
            />
            {t.auth.remember}
          </label>
        ) : null}
        {error ? <p className="text-sm text-secondary" role="alert">{error}</p> : null}
        {blocked ? (
          <a href={WHATSAPP_DEVICES} className="inline-block text-sm text-primary" target="_blank" rel="noreferrer">
            {t.devices.whatsapp}
          </a>
        ) : null}
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
