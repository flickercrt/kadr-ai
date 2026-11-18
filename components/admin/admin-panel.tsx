"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/avatar";
import { ProgressPanel } from "@/components/admin/progress-panel";
import { SignupNotices } from "@/components/admin/signup-notices";
import { RenewalAdmin } from "@/components/admin/renewal-admin";
import { StatsStrip } from "@/components/admin/stats-strip";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useMe } from "@/components/use-me";
import type { Locale } from "@/lib/i18n";
import { cleanAvatarUrl, cleanDisplayName } from "@/lib/profile";
import { isValidUsername, normalizeUsername, STUDENT_PASSWORD_MAX, STUDENT_PASSWORD_MIN } from "@/lib/username";
import { PaymentHistoryButton } from "@/components/admin/payment-history";
import { isDemoMode } from "@/lib/env";

type Student = {
  id: string;
  email: string | null;
  username: string | null;
  name: string | null;
  avatar: string | null;
  role: string;
  status: string;
  provider: string | null;
  currentPeriodEnd: string | null;
  courseIds: string[];
};

type ApiError = { error?: { code?: string; ar?: string; en?: string } };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

function identityOf(student: Student) {
  return student.username || student.email || "—";
}

export function AdminPanel() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [students, setStudents] = useState<Student[]>([]);
  const [configured, setConfigured] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [courseOptions, setCourseOptions] = useState<{ id: string; title: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBody, setBulkBody] = useState("");
  const [bulkPending, setBulkPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activateNow, setActivateNow] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [resetFor, setResetFor] = useState<Student | null>(null);
  const [nextPassword, setNextPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [profileFor, setProfileFor] = useState<Student | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [profileRole, setProfileRole] = useState("student");
  const [profileError, setProfileError] = useState("");
  const [profilePending, setProfilePending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/students");
    const data = (await response.json()) as { configured?: boolean; students?: Student[] } & ApiError;
    if (response.status === 403) {
      if (!isDemoMode()) {
        setForbidden(true);
        setError(t.admin.forbidden);
        setLoading(false);
        return;
      }
      setForbidden(false);
      setConfigured(true);
      setStudents([
        {
          id: "00000000-0000-4000-8000-000000000001",
          email: null,
          username: "sara",
          name: "سارة",
          avatar: null,
          role: "student",
          status: "active",
          provider: "stripe",
          currentPeriodEnd: "2026-12-01T00:00:00.000Z",
          courseIds: [],
        },
      ]);
      setLoading(false);
      return;
    }
    setForbidden(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      setLoading(false);
      return;
    }
    setConfigured(Boolean(data.configured));
    setStudents(data.students ?? []);
    setCourseOptions((data as { courses?: { id: string; title: string }[] }).courses ?? []);
    setLoading(false);
  }, [locale, t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  function closeForm() {
    setShowForm(false);
    setUsername("");
    setPassword("");
    setName("");
    setActivateNow(true);
    setFormError("");
  }

  function closeReset() {
    setResetFor(null);
    setNextPassword("");
    setResetError("");
  }

  async function setActive(userId: string, active: boolean) {
    setNotice("");
    setError("");
    const response = await fetch("/api/admin/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, active }),
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as ApiError;
      setError(errorText(data, locale, t.common.error));
      return;
    }
    setNotice(t.admin.saved);
    await load();
  }

  async function createStudent(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setNotice("");
    setError("");
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      setFormError(t.auth.usernameInvalid);
      return;
    }
    if (password.length < STUDENT_PASSWORD_MIN || password.length > STUDENT_PASSWORD_MAX) {
      setFormError(t.admin.passwordHint);
      return;
    }
    setCreating(true);
    const response = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalized, password, name: name.trim(), activate: activateNow }),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setCreating(false);
    if (!response.ok) {
      const message = errorText(data, locale, t.common.error);
      if (data.error?.code === "membership_failed") {
        closeForm();
        setError(message);
        await load();
        return;
      }
      setFormError(message);
      return;
    }
    closeForm();
    setNotice(t.admin.created);
    await load();
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!resetFor) return;
    setResetError("");
    setNotice("");
    if (nextPassword.length < STUDENT_PASSWORD_MIN || nextPassword.length > STUDENT_PASSWORD_MAX) {
      setResetError(t.admin.passwordHint);
      return;
    }
    setResetting(true);
    const response = await fetch("/api/admin/students/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: resetFor.id, password: nextPassword }),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setResetting(false);
    if (!response.ok) {
      setResetError(errorText(data, locale, t.common.error));
      return;
    }
    closeReset();
    setNotice(t.admin.resetDone);
  }

  const needle = query.trim().toLowerCase();
  const visible = students.filter((student) => {
    if (statusFilter !== "all" && student.status !== statusFilter) return false;
    if (courseFilter !== "all" && !(student.courseIds ?? []).includes(courseFilter)) return false;
    if (!needle) return true;
    return `${student.username ?? ""} ${student.email ?? ""} ${student.name ?? ""}`.toLowerCase().includes(needle);
  });

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="members" />
        <h1 className="text-3xl font-semibold">{t.admin.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.admin.lead}</p>
        <StatsStrip />
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.admin.search} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label={t.admin.status}
              className="h-11 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">{t.admin.filterStatus}</option>
              <option value="active">{t.account.active}</option>
              <option value="inactive">{t.account.inactive}</option>
              <option value="past_due">{t.account.pastDue}</option>
              <option value="canceled">{t.account.canceled}</option>
            </select>
            <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 text-sm">
              <option value="all">{t.admin.filterCourse}</option>
              {courseOptions.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          <a href="/api/admin/export" className={buttonVariants({ variant: "outline" })}>
            {t.admin.export}
          </a>
          {configured && !forbidden ? (
            <Button type="button" onClick={() => (showForm ? closeForm() : setShowForm(true))}>
              {showForm ? t.common.cancel : t.admin.add}
            </Button>
          ) : null}
        </div>
        {showForm && configured && !forbidden ? (
          <form onSubmit={(event) => void createStudent(event)} className="mt-4 max-w-xl space-y-3 rounded-lg border border-border bg-surface p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.admin.username}</span>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                dir="ltr"
                className="text-left"
                required
                maxLength={32}
              />
              <span className="mt-1 block text-xs text-muted">{t.admin.usernameHint}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">{t.admin.password}</span>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                dir="ltr"
                className="text-left"
                required
                minLength={STUDENT_PASSWORD_MIN}
              />
              <span className="mt-1 block text-xs text-muted">{t.admin.passwordHint}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted">
                {t.admin.displayName} <span className="text-xs">({t.admin.optional})</span>
              </span>
              <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={activateNow}
                onChange={(event) => setActivateNow(event.target.checked)}
                className="size-4 accent-[#00D4B4]"
              />
              {t.admin.activateNow}
            </label>
            {formError ? <p className="text-sm text-secondary" role="alert">{formError}</p> : null}
            <Button type="submit" disabled={creating}>
              {creating ? t.common.loading : t.admin.create}
            </Button>
          </form>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {!loading && visible.length === 0 && configured ? <p className="mt-6 text-sm text-muted">{t.admin.empty}</p> : null}
        {selectedIds.length > 0 ? (
          <form
            className="mt-4 space-y-3 rounded-lg border border-border bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void (async () => {
                setBulkPending(true);
                setError("");
                const response = await fetch("/api/admin/messages", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userIds: selectedIds, body: bulkBody }),
                });
                const data = (await response.json().catch(() => ({}))) as ApiError;
                setBulkPending(false);
                if (!response.ok) {
                  setError(data.error?.code === "config" ? t.inbox.schema : errorText(data, locale, t.common.error));
                  return;
                }
                setBulkBody("");
                setSelectedIds([]);
                setNotice(t.admin.bulkSent);
              })();
            }}
          >
            <p className="text-sm font-semibold">{t.admin.bulk} ({selectedIds.length})</p>
            <Textarea value={bulkBody} onChange={(event) => setBulkBody(event.target.value)} required maxLength={2000} />
            <Button type="submit" disabled={bulkPending}>{bulkPending ? t.common.loading : t.admin.bulkSend}</Button>
          </form>
        ) : null}
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="p-3 text-start font-medium">
                  <button type="button" className="text-primary" onClick={() => setSelectedIds(selectedIds.length === visible.length ? [] : visible.map((student) => student.id))}>
                    {selectedIds.length === visible.length && visible.length > 0 ? t.admin.clearSelected : t.admin.selectVisible}
                  </button>
                </th>
                <th className="p-3 text-start font-medium">{t.admin.email}</th>
                <th className="p-3 text-start font-medium">{t.admin.name}</th>
                <th className="p-3 text-start font-medium">{t.admin.status}</th>
                <th className="p-3 text-start font-medium">{t.admin.provider}</th>
                <th className="p-3 text-start font-medium">{t.admin.action}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((student) => (
                <tr key={student.id} className="border-t border-border">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={(event) => {
                        setSelectedIds((current) => event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id));
                      }}
                      aria-label={identityOf(student)}
                    />
                  </td>
                  <td className="p-3">
                    <span dir="ltr">{identityOf(student)}</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={student.name || student.username || ""} src={student.avatar} size={28} />
                      {student.name}
                    </span>
                  </td>
                  <td className="p-3">{student.status}</td>
                  <td className="p-3">{student.provider || "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {student.status === "active" ? (
                        <Button size="sm" variant="outline" onClick={() => void setActive(student.id, false)}>
                          {t.admin.deactivate}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => void setActive(student.id, true)}>
                          {t.admin.activate}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setResetError("");
                          setNextPassword("");
                          setResetFor(student);
                        }}
                      >
                        {t.admin.reset}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProfileError("");
                          setProfileName(student.name ?? "");
                          setProfileAvatar(student.avatar ?? "");
                          setProfileRole(student.role || "student");
                          setProfileFor(student);
                        }}
                      >
                        {t.admin.editProfile}
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/chat/${student.id}`}>{t.chatThread.open}</Link>
                      </Button>
                      <PaymentHistoryButton userId={student.id} />
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/students/${student.id}`}>{t.devices.student}</Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <RenewalAdmin />
        <SignupNotices />
        <ProgressPanel />
      </div>
      <Modal open={resetFor !== null} onOpenChange={(open) => { if (!open) closeReset(); }} title={t.admin.resetTitle}>
        <form onSubmit={(event) => void resetPassword(event)} className="space-y-3">
          <p className="text-sm text-muted">{t.admin.resetLead}</p>
          {resetFor ? <p className="text-sm" dir="ltr">{identityOf(resetFor)}</p> : null}
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.admin.password}</span>
            <Input
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              autoComplete="new-password"
              autoFocus
              dir="ltr"
              className="text-left"
              required
              minLength={STUDENT_PASSWORD_MIN}
            />
            <span className="mt-1 block text-xs text-muted">{t.admin.passwordHint}</span>
          </label>
          {resetError ? <p className="text-sm text-secondary" role="alert">{resetError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={resetting}>
              {resetting ? t.common.loading : t.admin.resetSave}
            </Button>
            <Button type="button" variant="outline" onClick={closeReset}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        open={profileFor !== null}
        onOpenChange={(open) => {
          if (!open) setProfileFor(null);
        }}
        title={t.admin.editProfileTitle}
      >
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!profileFor) return;
            if (cleanDisplayName(profileName) === null || cleanAvatarUrl(profileAvatar) === null) {
              setProfileError(t.account.profileInvalid);
              return;
            }
            void (async () => {
              setProfilePending(true);
              setProfileError("");
              const response = await fetch("/api/admin/students/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: profileFor.id, name: profileName, avatarUrl: profileAvatar, role: profileRole }),
              });
              const data = (await response.json().catch(() => ({}))) as ApiError;
              setProfilePending(false);
              if (!response.ok) {
                setProfileError(data.error?.code === "config" ? t.account.profileSchema : errorText(data, locale, t.account.profileInvalid));
                return;
              }
              setProfileFor(null);
              setNotice(t.account.profileSaved);
              await load();
            })();
          }}
        >
          {profileFor ? (
            <div className="flex items-center gap-3">
              <Avatar name={profileName} src={profileAvatar} size={48} />
              <span dir="ltr" className="text-sm text-muted">{identityOf(profileFor)}</span>
            </div>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.admin.role}</span>
            <select
              value={profileRole}
              onChange={(event) => setProfileRole(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="student">{t.admin.roleStudent}</option>
              <option value="instructor">{t.admin.roleInstructor}</option>
              <option value="admin">{t.admin.roleAdmin}</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.account.profileName}</span>
            <Input value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={80} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.account.profilePhoto}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block text-xs text-muted"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file || !profileFor) return;
                void (async () => {
                  const body = new FormData();
                  body.set("file", file);
                  body.set("userId", profileFor.id);
                  const response = await fetch("/api/admin/students/avatar", { method: "POST", body });
                  const data = (await response.json().catch(() => ({}))) as { avatarUrl?: string; error?: { code?: string } };
                  if (!response.ok || !data.avatarUrl) {
                    setProfileError(data.error?.code === "config" ? t.account.profileSchema : t.account.profileInvalid);
                    return;
                  }
                  setProfileAvatar(data.avatarUrl);
                })();
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t.account.profileUrl}</span>
            <Input
              value={profileAvatar.startsWith("data:") ? "" : profileAvatar}
              onChange={(event) => setProfileAvatar(event.target.value)}
              dir="ltr"
              className="text-left"
              placeholder="https://"
            />
          </label>
          {profileError ? <p className="text-sm text-secondary" role="alert">{profileError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={profilePending}>{profilePending ? t.common.loading : t.account.profileSave}</Button>
            <Button type="button" variant="outline" onClick={() => setProfileFor(null)}>{t.common.cancel}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
