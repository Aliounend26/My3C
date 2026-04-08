import DOMPurify from "dompurify";

export const RichTextContent = ({ html, emptyLabel = "Aucun contenu disponible." }) => {
  if (!html?.trim()) {
    return <div className="text-sm text-slate-500">{emptyLabel}</div>;
  }

  const sanitizedHtml = DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "target",
      "rel"
    ]
  });

  return <div className="lesson-content text-slate-700" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};
