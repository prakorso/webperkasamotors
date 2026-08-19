"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { createArticle, updateArticle, deleteArticle, type ArticleInput } from "@/lib/actions/articles";

const SELECT_CLASS =
  "h-11 w-full border border-border bg-surface px-3 font-body text-body text-ink focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary";

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border border-border bg-surface p-6">
      <legend className="px-2 font-body text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        {title}
      </legend>
      <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/**
 * Real create/edit, backed by lib/actions/articles.ts. Cover/OG image
 * upload only appears on the edit page (components/admin/
 * article-image-upload.tsx, rendered by the page, not this form) — same
 * "save first, then add media" order as vehicles
 * (app/(admin)/admin/(shell)/inventory/new/page.tsx).
 *
 * Slug is editable but optional to type: leaving it blank means "derive
 * from Title", same generation rule the Server Action applies. Once an
 * article exists, changing Title alone does NOT change its slug (see
 * updateArticle) — only editing the Slug field itself does, and doing so
 * on a previously-published article records the old slug into
 * article_slug_history so its public URL keeps resolving via a redirect.
 */
/** Small "required"/"(Optional)" markers — kept local to this form rather
 *  than added to the shared Label component, so this UX pass stays scoped
 *  to Articles only, per the batch's explicit boundaries. */
function RequiredMark() {
  return (
    <span className="ml-1 font-body text-[12px] font-bold normal-case text-primary" aria-hidden>
      *
    </span>
  );
}
function OptionalMark() {
  return <span className="ml-1 font-body text-[11px] font-normal normal-case text-muted-2">(Optional)</span>;
}

/** True for both slug-shaped errors this form can receive: a direct slug
 *  uniqueness collision (updateArticle/createArticle's friendlyConstraintError)
 *  and "could not generate a URL from the title" (createArticle/updateArticle,
 *  raised when both Slug and Title fail to produce anything sluggable). Both
 *  are actionable from the Slug field, so both surface there instead of the
 *  general error slot. */
function isSlugError(message: string): boolean {
  return /slug|url/i.test(message);
}

export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const isEdit = Boolean(article);

  const [form, setForm] = useState({
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    category: article?.category ?? "",
    tags: (article?.tags ?? []).join(", "),
    status: article?.status ?? "DRAFT",
    seoTitle: article?.seoTitle ?? "",
    seoDescription: article?.seoDescription ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Slug-shaped errors are shown next to the Slug field instead of the
  // general error slot — see isSlugError above. Kept as its own state
  // rather than reusing `error` so the two can never fight over the same
  // message on one submit.
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSlugError(null);

    const input: ArticleInput = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content,
      category: form.category || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: form.status,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
    };

    const result =
      isEdit && article ? await updateArticle(article.id, input) : await createArticle(input);

    setSaving(false);
    if (result.error) {
      if (isSlugError(result.error)) {
        setSlugError(result.error);
      } else {
        setError(result.error);
      }
      return;
    }
    setSaved(true);
    if (!isEdit && "id" in result && result.id) {
      router.push(`/admin/articles/${result.id}`);
    } else {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!article) return;
    if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    const result = await deleteArticle(article.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/admin/articles");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Fieldset title="Content">
        <div>
          <Label htmlFor="title">
            Title
            <RequiredMark />
          </Label>
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="slug">
            URL Slug
            <OptionalMark />
          </Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => {
              set("slug", e.target.value);
              setSlugError(null);
            }}
            placeholder="Leave blank to generate from title"
          />
          {isEdit && article && (
            <p className="mt-1.5 truncate font-body text-[12px] text-muted-2">
              /articles/{article.slug}
            </p>
          )}
          {slugError && <p className="mt-1.5 font-body text-[12px] text-primary">{slugError}</p>}
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="excerpt">
            Excerpt
            <OptionalMark />
          </Label>
          <Textarea
            id="excerpt"
            rows={2}
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            placeholder="Short summary shown on the articles listing page"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="content">
            Body
            <RequiredMark />
          </Label>
          <Textarea
            id="content"
            rows={14}
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            placeholder={"Write the article here. Leave a blank line between paragraphs."}
            required
          />
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            Plain text — a blank line starts a new paragraph on the public page.
          </p>
        </div>
      </Fieldset>

      <Fieldset title="Organization &amp; Publishing">
        <div>
          <Label htmlFor="category">
            Category
            <OptionalMark />
          </Label>
          <Input
            id="category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="e.g. Buying Guide"
          />
        </div>
        <div>
          <Label htmlFor="tags">
            Tags
            <OptionalMark />
          </Label>
          <Input
            id="tags"
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="Comma-separated, e.g. maintenance, tips"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as typeof form.status)}
            className={SELECT_CLASS}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <p className="mt-1.5 font-body text-[12px] text-muted-2">
            <strong className="text-ink">Draft</strong> — Not visible on the public website.
            <br />
            <strong className="text-ink">Published</strong> — Visible on the public website.
          </p>
        </div>
      </Fieldset>

      <Fieldset title="SEO (optional)">
        <div>
          <Label htmlFor="seoTitle">
            SEO Title
            <OptionalMark />
          </Label>
          <Input
            id="seoTitle"
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
            placeholder="Falls back to Title"
          />
        </div>
        <div>
          <Label htmlFor="seoDescription">
            SEO Description
            <OptionalMark />
          </Label>
          <Input
            id="seoDescription"
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            placeholder="Falls back to Excerpt"
          />
        </div>
      </Fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Article"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/admin/articles")}
        >
          Cancel
        </Button>
        {isEdit && article && (
          <Button type="button" variant="ghost" size="lg" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
        {saved && <span className="font-body text-[13px] text-success">Saved.</span>}
        {error && <span className="font-body text-[13px] text-primary">{error}</span>}
      </div>
    </form>
  );
}
