/**
 * Renders an article's plain-text body as paragraphs — a blank line in
 * the admin Textarea starts a new <p>. No markdown/rich-text dependency
 * was added for this; the admin body field is plain text, matching the
 * simplicity level of vehicles.description elsewhere in this codebase.
 */
export function ArticleContent({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {paragraphs.map((paragraph, i) => (
        <p key={i} className="whitespace-pre-line font-body text-body text-ink lg:text-body-lg">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
