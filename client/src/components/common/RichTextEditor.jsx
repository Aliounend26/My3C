import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Info,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PenSquare,
  Quote,
  Table2,
  TriangleAlert,
  Underline as UnderlineIcon,
  Upload,
  Youtube as YoutubeIcon
} from "lucide-react";
import { RichTextContent } from "./RichTextContent";

const toolbarButtonClass = "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50";
const activeToolbarButtonClass = `${toolbarButtonClass} bg-slate-950 text-white hover:bg-slate-900`;

const ToolbarButton = ({ active, label, icon: Icon, onClick }) => (
  <button type="button" title={label} aria-label={label} className={active ? activeToolbarButtonClass : toolbarButtonClass} onClick={onClick}>
    <Icon size={16} strokeWidth={2} />
  </button>
);

export const RichTextEditor = ({ value, onChange, placeholder = "Commencez a rediger votre contenu...", onRequestImageUpload }) => {
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      Highlight,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank"
        }
      }),
      Image.configure({
        inline: false
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"]
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        controls: true,
        nocookie: true
      })
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "lesson-editor min-h-[320px] rounded-b-3xl px-5 py-5 outline-none"
      }
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    }
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if ((value || "") !== currentHtml) {
      editor.commands.setContent(value || "", false);
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Initialisation de l'editeur...
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("Lien URL", previousUrl);
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const setImage = () => {
    const url = window.prompt("URL de l'image");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const handleImageFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !onRequestImageUpload) return;

    setUploadingImage(true);
    try {
      const url = await onRequestImageUpload(file);
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const setYoutube = () => {
    const url = window.prompt("URL YouTube ou embed");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
  };

  const insertInfoBlock = () => {
    editor.chain().focus().insertContent('<blockquote><p><strong>Info :</strong> Ajoutez ici une information importante pour vos apprenants.</p></blockquote>').run();
  };

  const insertAlertBlock = () => {
    editor.chain().focus().insertContent('<blockquote><p><strong>Alerte :</strong> Ajoutez ici une consigne ou un point de vigilance.</p></blockquote>').run();
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <ToolbarButton active={!previewMode} label="Edition" icon={PenSquare} onClick={() => setPreviewMode(false)} />
          <ToolbarButton active={previewMode} label="Apercu" icon={Eye} onClick={() => setPreviewMode(true)} />
        </div>

        {!previewMode ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <ToolbarButton active={editor.isActive("heading", { level: 1 })} label="Titre 1" icon={Heading1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
            <ToolbarButton active={editor.isActive("heading", { level: 2 })} label="Titre 2" icon={Heading2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
            <ToolbarButton active={editor.isActive("heading", { level: 3 })} label="Titre 3" icon={Heading3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
            <ToolbarButton active={editor.isActive("bold")} label="Gras" icon={Bold} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolbarButton active={editor.isActive("italic")} label="Italique" icon={Italic} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolbarButton active={editor.isActive("underline")} label="Souligne" icon={UnderlineIcon} onClick={() => editor.chain().focus().toggleUnderline().run()} />
            <ToolbarButton active={editor.isActive("highlight")} label="Surligner" icon={Highlighter} onClick={() => editor.chain().focus().toggleHighlight().run()} />
            <ToolbarButton active={editor.isActive("bulletList")} label="Liste a puces" icon={List} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolbarButton active={editor.isActive("orderedList")} label="Liste numerotee" icon={ListOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolbarButton active={editor.isActive("blockquote")} label="Citation" icon={Quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ToolbarButton active={editor.isActive("codeBlock")} label="Bloc de code" icon={Code2} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
            <ToolbarButton active={false} label="Lien" icon={Link2} onClick={setLink} />
            <ToolbarButton active={false} label="Image par URL" icon={ImagePlus} onClick={setImage} />
            <ToolbarButton active={false} label={uploadingImage ? "Upload en cours" : "Importer une image"} icon={Upload} onClick={() => fileInputRef.current?.click()} />
            <ToolbarButton active={false} label="YouTube" icon={YoutubeIcon} onClick={setYoutube} />
            <ToolbarButton active={false} label="Tableau" icon={Table2} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
            <ToolbarButton active={false} label="Separateur" icon={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
            <ToolbarButton active={false} label="Bloc info" icon={Info} onClick={insertInfoBlock} />
            <ToolbarButton active={false} label="Bloc alerte" icon={TriangleAlert} onClick={insertAlertBlock} />
            <ToolbarButton active={false} label="Aligner a gauche" icon={AlignLeft} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
            <ToolbarButton active={false} label="Centrer" icon={AlignCenter} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
            <ToolbarButton active={false} label="Aligner a droite" icon={AlignRight} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
          </div>
        ) : null}
      </div>

      {previewMode ? (
        <div className="p-5">
          <RichTextContent html={value} emptyLabel={placeholder} />
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}
      <input ref={fileInputRef} className="sr-only" type="file" accept="image/*" onChange={handleImageFile} />
    </div>
  );
};
