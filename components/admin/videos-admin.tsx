"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YoutubePlayer } from "@/components/youtube-player";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";
import { parseHomepageVideo, type HomepageVideo } from "@/lib/homepage-videos";
import type { Locale } from "@/lib/i18n";

type ApiError = { error?: { ar?: string; en?: string } };

function errorText(data: ApiError, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

function move(items: HomepageVideo[], id: string, direction: -1 | 1) {
  const index = items.findIndex((item) => item.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= items.length) return null;
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy.map((entry) => entry.id);
}

export function VideosAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [videos, setVideos] = useState<HomepageVideo[]>([]);
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<HomepageVideo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmId, setConfirmId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/videos");
    const data = (await response.json()) as { configured?: boolean; ready?: boolean; videos?: HomepageVideo[] } & ApiError;
    if (response.status === 403) {
      setForbidden(true);
      setError(t.admin.forbidden);
      setLoading(false);
      return;
    }
    setForbidden(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      setLoading(false);
      return;
    }
    setConfigured(data.configured !== false);
    setReady(data.ready !== false);
    setVideos(data.videos ?? []);
    setLoading(false);
  }, [locale, t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setYoutubeUrl("");
    setShowForm(true);
    setError("");
  }

  function openEdit(video: HomepageVideo) {
    setEditing(video);
    setTitle(video.title);
    setYoutubeUrl(video.youtubeUrl);
    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setTitle("");
    setYoutubeUrl("");
  }

  async function send(body: unknown, success: string) {
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as ApiError;
    setPending(false);
    if (!response.ok) {
      setError(errorText(data, locale, t.common.error));
      return false;
    }
    setNotice(success);
    setConfirmId("");
    await load();
    return true;
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    if (!parseHomepageVideo({ title, youtubeUrl })) {
      setError(t.videos.invalid);
      return;
    }
    const ok = await send(
      editing ? { action: "update", id: editing.id, title, youtubeUrl } : { action: "create", title, youtubeUrl },
      t.videos.saved,
    );
    if (ok) closeForm();
  }

  async function reorder(id: string, direction: -1 | 1) {
    const ids = move(videos, id, direction);
    if (!ids) return;
    await send({ action: "reorder", ids }, t.videos.saved);
  }

  const preview = parseHomepageVideo({ title: title || t.videos.titleField, youtubeUrl });
  const showEditor = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="videos" />
        <h1 className="text-3xl font-semibold">{t.videos.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.videos.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? (
          <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.videos.schema}</p>
        ) : null}
        {showEditor ? (
          <div className="mt-6">
            {showForm ? (
              <form onSubmit={(event) => void onSave(event)} className="max-w-xl space-y-3 rounded-lg border border-border bg-surface p-4">
                <h2 className="text-lg font-semibold">{editing ? t.videos.edit : t.videos.add}</h2>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.videos.titleField}</span>
                  <Input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={140} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-muted">{t.videos.url}</span>
                  <Input
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    dir="ltr"
                    className="text-left"
                    placeholder="https://www.youtube.com/watch?v="
                    required
                    maxLength={500}
                  />
                  <span className="mt-1 block text-xs text-muted">{t.videos.urlHint}</span>
                </label>
                {preview?.embedUrl ? (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <YoutubePlayer title={preview.title} embedUrl={preview.embedUrl} />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.videos.save}</Button>
                  <Button type="button" variant="outline" onClick={closeForm}>{t.common.cancel}</Button>
                </div>
              </form>
            ) : (
              <Button type="button" onClick={openCreate}>{t.videos.add}</Button>
            )}
          </div>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-muted">{t.common.loading}</p> : null}
        {!loading && videos.length === 0 && ready && configured && !forbidden ? (
          <p className="mt-6 text-sm text-muted">{t.videos.empty}</p>
        ) : null}
        <ul className="mt-6 space-y-3">
          {videos.map((video, index) => (
            <li key={video.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">{video.title}</h2>
                  <p className="mt-1 truncate text-xs text-primary" dir="ltr">{video.youtubeUrl}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={index === 0 || pending} onClick={() => void reorder(video.id, -1)}>{t.videos.up}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={index === videos.length - 1 || pending} onClick={() => void reorder(video.id, 1)}>{t.videos.down}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => openEdit(video)}>{t.videos.editAction}</Button>
                  {confirmId === video.id ? (
                    <Button type="button" size="sm" variant="secondary" onClick={() => void send({ action: "delete", id: video.id }, t.videos.removed)}>{t.videos.confirmRemove}</Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => setConfirmId(video.id)}>{t.videos.remove}</Button>
                  )}
                </div>
              </div>
              {video.embedUrl ? (
                <div className="mt-4 overflow-hidden rounded-lg border border-border">
                  <YoutubePlayer title={video.title} embedUrl={video.embedUrl} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
