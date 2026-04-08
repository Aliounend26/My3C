import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ImagePlus, Upload } from "lucide-react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { RichTextEditor } from "../../components/common/RichTextEditor";
import { StatCard } from "../../components/common/StatCard";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";
import { getYoutubeEmbedUrl } from "../../utils/media";

const initialForm = {
  title: "",
  description: "",
  content: "",
  order: 1,
  estimatedMinutes: 30,
  youtubeEmbedUrl: "",
  image: "",
  attachmentsText: ""
};

export const TeacherLessonsPage = () => {
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [lessons, setLessons] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const [uploadingLessonImage, setUploadingLessonImage] = useState(false);

  const queryCourse = searchParams.get("course");

  const loadLessons = async (courseId, sectionId) => {
    const endpoint = sectionId ? `/lessons?section=${sectionId}` : courseId ? `/lessons?course=${courseId}` : "/lessons";
    setLessons(await resourceService.get(endpoint));
  };

  const loadSections = async (courseId) => {
    if (!courseId) {
      setSections([]);
      setSelectedSection("");
      return;
    }
    const sectionsData = await resourceService.get(`/sections?course=${courseId}`);
    setSections(sectionsData);
    setSelectedSection(sectionsData[0]?._id || "");
    return sectionsData;
  };

  useEffect(() => {
    const load = async () => {
      const coursesData = await resourceService.get("/courses/groups");
      setCourses(coursesData);
      const initialCourse = queryCourse || coursesData[0]?._id || "";
      setSelectedCourse(initialCourse);
      const sectionsData = await loadSections(initialCourse);
      await loadLessons(initialCourse, sectionsData?.[0]?._id || "");
    };

    load();
  }, [queryCourse]);

  const totalDuration = useMemo(() => (lessons || []).reduce((sum, lesson) => sum + (lesson.estimatedMinutes || 0), 0), [lessons]);

  const uploadImageAsset = async (file) => {
    if (!selectedCourse) {
      throw new Error("Selectionnez d'abord un cours avant d'ajouter une image.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("course", selectedCourse);
    if (selectedSection) {
      formData.append("section", selectedSection);
    }
    formData.append("title", `Image lecon - ${file.name}`);
    formData.append("description", "Image importee depuis l'editeur de lecon");
    formData.append("type", "image");

    const uploaded = await resourceService.postForm("/resources", formData);
    return `${import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:5000"}${uploaded.url}`;
  };

  if (!lessons) return <Loader label="Chargement des lecons..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lecons du cours"
        title="Gestion des lecons"
        description="Creez les lecons de chaque section, ordonnez-les et enrichissez-les avec du contenu, des videos et des medias."
        actions={
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => { setEditing(null); setForm(initialForm); setOpen(true); }}>
            Nouvelle lecon
          </button>
        }
      />

      <div className="glass-card grid gap-4 p-5 md:grid-cols-2">
        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={selectedCourse} onChange={async (event) => { const value = event.target.value; setSelectedCourse(value); const sectionsData = await loadSections(value); await loadLessons(value, sectionsData?.[0]?._id || ""); }}>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={selectedSection} onChange={async (event) => { const value = event.target.value; setSelectedSection(value); await loadLessons(selectedCourse, value); }}>
          <option value="">Toutes les sections</option>
          {sections.map((section) => (
            <option key={section._id} value={section._id}>
              {section.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Lecons" value={lessons.length} hint="Dans la vue actuelle" accent="bg-blue-500" />
        <StatCard title="Sections" value={sections.length} hint="Pour ce cours" accent="bg-cyan-500" />
        <StatCard title="Duree totale" value={`${totalDuration} min`} hint="Volume pedagogique" accent="bg-violet-500" />
      </div>

      <div className="glass-card p-5">
        <DataTable
          columns={[
            { key: "title", label: "Lecon", sortable: true },
            { key: "section", label: "Section", render: (row) => row.section?.title || "-" },
            { key: "order", label: "Ordre", sortable: true },
            { key: "estimatedMinutes", label: "Minutes", sortable: true },
            { key: "youtubeEmbedUrl", label: "Video", render: (row) => (row.youtubeEmbedUrl ? "Oui" : "Non") },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => { setEditing(row); setForm({ title: row.title || "", description: row.description || "", content: row.content || "", order: row.order || 1, estimatedMinutes: row.estimatedMinutes || 30, youtubeEmbedUrl: row.youtubeEmbedUrl || "", image: row.image || "", attachmentsText: (row.attachments || []).join("\n") }); setSelectedSection(row.section?._id || row.section || ""); setOpen(true); }}>
                    Modifier
                  </button>
                  <button className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700" onClick={async () => { await resourceService.delete(`/lessons/${row._id}`); await loadLessons(selectedCourse, selectedSection); }}>
                    Supprimer
                  </button>
                </div>
              )
            }
          ]}
          rows={lessons}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Modifier une lecon" : "Nouvelle lecon"} size="xl">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const payload = {
              course: selectedCourse,
              section: selectedSection,
              title: form.title,
              description: form.description,
              content: form.content,
              order: form.order,
              estimatedMinutes: form.estimatedMinutes,
              youtubeEmbedUrl: getYoutubeEmbedUrl(form.youtubeEmbedUrl),
              image: form.image,
              attachments: form.attachmentsText.split("\n").map((item) => item.trim()).filter(Boolean)
            };

            if (editing) {
              await resourceService.put(`/lessons/${editing._id}`, payload);
            } else {
              await resourceService.post("/lessons", payload);
            }

            setOpen(false);
            setEditing(null);
            setForm(initialForm);
            await loadLessons(selectedCourse, selectedSection);
          }}
          className="space-y-5"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={selectedSection} onChange={(event) => setSelectedSection(event.target.value)} required>
              <option value="">Choisir une section</option>
              {sections.map((section) => (
                <option key={section._id} value={section._id}>
                  {section.title}
                </option>
              ))}
            </select>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Titre" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
          </div>
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Description courte de la lecon" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Redigez ici le vrai contenu pedagogique de la lecon avec titres, listes, liens, images, tableaux, videos YouTube et apercu avant publication.
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm((current) => ({ ...current, content }))}
              placeholder="Redigez la lecon complete..."
              onRequestImageUpload={async (file) => {
                setUploadingInlineImage(true);
                try {
                  return await uploadImageAsset(file);
                } finally {
                  setUploadingInlineImage(false);
                }
              }}
            />
            {uploadingInlineImage ? <p className="text-sm text-slate-500">Import de l'image dans l'editeur...</p> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" placeholder="Ordre" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))} />
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" placeholder="Minutes estimees" value={form.estimatedMinutes} onChange={(event) => setForm((current) => ({ ...current, estimatedMinutes: Number(event.target.value) }))} />
          </div>
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="URL YouTube complementaire (optionnel)" value={form.youtubeEmbedUrl} onChange={(event) => setForm((current) => ({ ...current, youtubeEmbedUrl: event.target.value }))} />
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-3 text-brand-500 shadow-sm">
                <ImagePlus size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950">Image de la lecon</p>
                <p className="mt-1 text-xs text-slate-500">Ajoutez une URL ou importez un fichier image directement.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Image URL" value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} />
              <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-fit">
                <Upload size={16} />
                {uploadingLessonImage ? "Import..." : "Importer une image"}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    setUploadingLessonImage(true);
                    try {
                      const uploadedUrl = await uploadImageAsset(file);
                      setForm((current) => ({ ...current, image: uploadedUrl }));
                    } finally {
                      setUploadingLessonImage(false);
                    }
                  }}
                />
              </label>
              {form.image ? <p className="break-all text-xs text-slate-500">{form.image}</p> : null}
            </div>
          </div>
          <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Fichiers ou liens, un par ligne" value={form.attachmentsText} onChange={(event) => setForm((current) => ({ ...current, attachmentsText: event.target.value }))} />
          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">{editing ? "Mettre a jour" : "Creer la lecon"}</button>
        </form>
      </Modal>
    </div>
  );
};
