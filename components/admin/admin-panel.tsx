"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/components/use-me";

type Student = {
  id: string;
  email: string | null;
  name: string | null;
  status: string;
  provider: string | null;
  currentPeriodEnd: string | null;
};

export function AdminPanel() {
  const { t } = useI18n();
  const { me } = useMe();
  const [students, setStudents] = useState<Student[]>([]);
  const [configured, setConfigured] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/students");
    if (response.status === 403) {
      setError(t.admin.forbidden);
      setLoading(false);
      return;
    }
    const data = (await response.json()) as { configured?: boolean; students?: Student[]; error?: { ar: string } };
    if (!response.ok) {
      setError(data.error?.ar || t.common.error);
      setLoading(false);
      return;
    }
    setConfigured(Boolean(data.configured));
    setStudents(data.students ?? []);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function setActive(userId: string, active: boolean) {
    setNotice("");
    const response = await fetch("/api/admin/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, active }),
    });
    if (!response.ok) {
      setError(t.common.error);
      return;
    }
    setNotice(t.admin.saved);
    await load();
  }

  const visible = students.filter((student) => (student.email || "").toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold">{t.admin.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.admin.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        <Input className="mt-6 max-w-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.admin.search} />
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {!loading && visible.length === 0 && configured ? <p className="mt-6 text-sm text-muted">{t.admin.empty}</p> : null}
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-muted">
              <tr>
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
                  <td className="p-3">{student.email}</td>
                  <td className="p-3">{student.name}</td>
                  <td className="p-3">{student.status}</td>
                  <td className="p-3">{student.provider || "—"}</td>
                  <td className="p-3">
                    {student.status === "active" ? (
                      <Button size="sm" variant="outline" onClick={() => void setActive(student.id, false)}>
                        {t.admin.deactivate}
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => void setActive(student.id, true)}>
                        {t.admin.activate}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
