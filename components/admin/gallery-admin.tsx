"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { AppHeader } from "@/components/app-header";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/components/use-me";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n";

type Category = { id: string; name: string };
type Item = {
  id: string;
  categoryId: string | null;
  title: string;
  description: string;
  mediaType: "image" | "video";
  imageUrl: string;
  videoUrl: string;
  published: boolean;
};

function errorText(data: { error?: { ar?: string; en?: string } }, locale: Locale, fallback: string) {
  return (locale === "ar" ? data.error?.ar : data.error?.en) || fallback;
}

export function GalleryAdmin() {
  const { t, locale } = useI18n();
  const { me } = useMe();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/gallery");
    const data = (await response.json()) as { configured?: boolean; ready?: boolean; categories?: Category[]; items?: Item[]; error?: { ar?: string; en?: string } };
    if (response.status === 403 && !isDemoMode()) {
      setForbidden(true);
      setError(t.admin.forbidden);
      return;
    }
    if (!response.ok && response.status !== 403) {
      setError(errorText(data, locale, t.common.error));
      return;
    }
    setConfigured(data.configured !== false);
    setReady(data.ready !== false);
    setCategories(data.categories ?? []);
    setItems(data.items ?? []);
  }, [locale, t]);

  useEffect(() => {
    const id = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(id);
  }, [load]);

  async function send(body: unknown) {
    setPending(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: { ar?: string; en?: string; code?: string } };
    setPending(false);
    if (!response.ok) {
      setError(data.error?.code === "config" ? t.galleryAdmin.schema : errorText(data, locale, t.galleryAdmin.invalid));
      return false;
    }
    setNotice(t.galleryAdmin.saved);
    await load();
    return true;
  }

  function openNew() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCategoryId(categories[0]?.id ?? "");
    setMediaType("image");
    setImageUrl("");
    setVideoUrl("");
    setPublished(true);
    setShowForm(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description);
    setCategoryId(item.categoryId ?? "");
    setMediaType(item.mediaType);
    setImageUrl(item.imageUrl);
    setVideoUrl(item.videoUrl);
    setPublished(item.published);
    setShowForm(true);
  }

  const showEditor = !forbidden || isDemoMode();

  return (
    <div className="min-h-dvh">
      <AppHeader me={me} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <AdminNav current="gallery" />
        <h1 className="text-3xl font-semibold">{t.galleryAdmin.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">{t.galleryAdmin.lead}</p>
        {error ? <p className="mt-4 text-sm text-secondary" role="alert">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-primary" role="status">{notice}</p> : null}
        {!configured ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm">{t.admin.unconfigured}</p> : null}
        {configured && !ready && !forbidden ? <p className="mt-4 rounded-lg border border-border bg-surface p-4 text-sm leading-7">{t.galleryAdmin.schema}</p> : null}
        {showEditor ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[16rem_1fr]">
            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="font-semibold">{t.galleryAdmin.categories}</h2>
              <form
                className="mt-3 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send({ action: "create-category", name: categoryName }).then((ok) => ok && setCategoryName(""));
                }}
              >
                <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder={t.galleryAdmin.categoryName} />
                <Button type="submit" size="sm">{t.galleryAdmin.add}</Button>
              </form>
              <ul className="mt-3 space-y-2">
                {categories.map((category, index) => (
                  <li key={category.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>{category.name}</span>
                    <span className="flex gap-1">
                      <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => void send({ action: "reorder-categories", ids: move(categories, index, -1) })}>{t.catalog.up}</Button>
                      <Button type="button" size="sm" variant="outline" disabled={index === categories.length - 1} onClick={() => void send({ action: "reorder-categories", ids: move(categories, index, 1) })}>{t.catalog.down}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void send({ action: "delete-category", id: category.id })}>{t.catalog.remove}</Button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              {showForm ? (
                <form
                  className="space-y-3 rounded-lg border border-border bg-surface p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fields = { title, description, categoryId: categoryId || null, mediaType, imageUrl, videoUrl, published };
                    void send(editing ? { action: "update-item", id: editing.id, ...fields } : { action: "create-item", ...fields }).then((ok) => ok && setShowForm(false));
                  }}
                >
                  <h2 className="font-semibold">{editing ? t.galleryAdmin.edit : t.galleryAdmin.addItem}</h2>
                  <label className="block text-sm"><span className="mb-1 block text-muted">{t.catalog.titleField}</span><Input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={140} /></label>
                  <label className="block text-sm"><span className="mb-1 block text-muted">{t.catalog.description}</span><Textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} /></label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted">{t.galleryAdmin.category}</span>
                    <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                      <option value="">{t.galleryAdmin.uncategorized}</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted">{t.galleryAdmin.media}</span>
                    <select value={mediaType} onChange={(event) => setMediaType(event.target.value as "image" | "video")} className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm">
                      <option value="image">{t.galleryAdmin.image}</option>
                      <option value="video">{t.galleryAdmin.video}</option>
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted">{t.galleryAdmin.imageUrl}</span>
                    <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} dir="ltr" className="text-left" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="mt-2 block text-xs text-muted"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const body = new FormData();
                        body.set("file", file);
                        void fetch("/api/admin/gallery/upload", { method: "POST", body }).then(async (response) => {
                          const data = (await response.json()) as { url?: string };
                          if (data.url) setImageUrl(data.url);
                          else setError(t.galleryAdmin.schema);
                        });
                      }}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-muted">{t.galleryAdmin.videoUrl}</span>
                    <Input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} dir="ltr" className="text-left" placeholder="https://www.youtube.com/watch?v=" />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} className="size-4 accent-[#00D4B4]" />
                    {t.catalog.published}
                  </label>
                  {imageUrl ? <img src={imageUrl} alt="" className="h-32 rounded-lg object-cover" /> : null}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={pending}>{pending ? t.common.loading : t.catalog.save}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t.common.cancel}</Button>
                  </div>
                </form>
              ) : (
                <Button type="button" onClick={openNew}>{t.galleryAdmin.addItem}</Button>
              )}
              <ul className="mt-4 space-y-2">
                {items.map((item, index) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                    <span>{item.title} <span className="text-xs text-muted">{item.published ? t.catalog.published : t.catalog.draft}</span></span>
                    <span className="flex flex-wrap gap-1">
                      <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => void send({ action: "reorder-items", ids: move(items, index, -1) })}>{t.catalog.up}</Button>
                      <Button type="button" size="sm" variant="outline" disabled={index === items.length - 1} onClick={() => void send({ action: "reorder-items", ids: move(items, index, 1) })}>{t.catalog.down}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => openEdit(item)}>{t.catalog.edit}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void send({ action: "delete-item", id: item.id })}>{t.catalog.remove}</Button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function move<T extends { id: string }>(items: T[], index: number, direction: -1 | 1) {
  const copy = items.slice();
  const next = index + direction;
  const [item] = copy.splice(index, 1);
  copy.splice(next, 0, item);
  return copy.map((entry) => entry.id);
}
