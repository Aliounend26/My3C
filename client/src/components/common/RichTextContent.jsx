import DOMPurify from "dompurify";

const moveEmbeddedVideosFirst = (html) => {
  if (typeof window === "undefined" || !html?.trim()) return html;

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes = Array.from(doc.body.childNodes);

  if (!nodes.length) return html;

  const embedNodes = [];
  const contentNodes = [];

  nodes.forEach((node) => {
    if (node.nodeType === window.Node.ELEMENT_NODE && node.querySelector?.("iframe")) {
      embedNodes.push(node);
      return;
    }

    contentNodes.push(node);
  });

  if (!embedNodes.length) return html;

  return [...embedNodes, ...contentNodes]
    .map((node) => {
      if (node.nodeType === window.Node.TEXT_NODE) return node.textContent;
      return node.outerHTML || "";
    })
    .join("");
};

export const RichTextContent = ({ html, className = "", emptyLabel = "Aucun contenu disponible." }) => {
  if (!html?.trim()) {
    return <div className="text-sm text-slate-500">{emptyLabel}</div>;
  }

  const sanitizedHtml = DOMPurify.sanitize(moveEmbeddedVideosFirst(html), {
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

  return <div className={`lesson-content text-slate-700 ${className}`.trim()} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};
