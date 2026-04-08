import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/tables/DataTable";
import { StatCard } from "../../components/common/StatCard";
import { resourceService } from "../../services/resourceService";

const initialForm = {
  title: "",
  description: "",
  order: 1
};

export const TeacherSectionsPage = () => {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [searchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [sectionItems, setSectionItems] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [error, setError] = useState("");

  const queryCourse = searchParams.get("course");

  const loadSections = async (courseId) => {
    if (!courseId) {
      setSections([]);
      setSelectedSectionId("");
      return "";
    }

    const sectionsData = await resourceService.get(`/sections?course=${courseId}`);
    setSections(sectionsData);
    const nextSectionId = sectionsData[0]?._id || "";
    setSelectedSectionId((current) => (sectionsData.some((section) => section._id === current) ? current : nextSectionId));
    return nextSectionId;
  };

  const loadBuilderData = async (courseId, sectionId) => {
    if (!courseId || !sectionId) {
      setSectionItems([]);
      setLessons([]);
      setQuizzes([]);
      return;
    }

    setBuilderLoading(true);
    try {
      const [itemsData, lessonsData, quizzesData] = await Promise.all([
        resourceService.get(`/sections/${sectionId}/items`),
        resourceService.get(`/lessons?course=${courseId}&section=${sectionId}`),
        resourceService.get(`/quizzes?course=${courseId}&section=${sectionId}`)
      ]);
      setSectionItems(itemsData);
      setLessons(lessonsData);
      setQuizzes(quizzesData);
    } catch (builderError) {
      console.error(builderError);
      setSectionItems([]);
      setLessons([]);
      setQuizzes([]);
      setError("Impossible de charger les items pedagogiques de cette section.");
    } finally {
      setBuilderLoading(false);
    }
  };

  const initializePage = async () => {
    setLoading(true);
    setError("");

    try {
      const coursesData = await resourceService.get("/courses/groups");
      setCourses(coursesData);

      const preferredCourseId = queryCourse || coursesData[0]?._id || "";
      setSelectedCourse(preferredCourseId);

      const nextSectionId = await loadSections(preferredCourseId);
      await loadBuilderData(preferredCourseId, nextSectionId);
    } catch (loadError) {
      console.error(loadError);
      setCourses([]);
      setSections([]);
      setSelectedCourse("");
      setSelectedSectionId("");
      setSectionItems([]);
      setLessons([]);
      setQuizzes([]);
      setError("Impossible de charger vos sections pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializePage();
  }, [queryCourse]);

  useEffect(() => {
    if (!selectedCourse || !selectedSectionId) {
      setSectionItems([]);
      return;
    }

    loadBuilderData(selectedCourse, selectedSectionId);
  }, [selectedCourse, selectedSectionId]);

  const currentSection = useMemo(
    () => sections.find((section) => section._id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );
  const linkedLessonIds = new Set(sectionItems.filter((item) => item.type === "lesson" && item.lesson?._id).map((item) => item.lesson._id));
  const linkedQuizIds = new Set(sectionItems.filter((item) => item.type === "quiz" && item.quiz?._id).map((item) => item.quiz._id));
  const availableLessons = lessons.filter((lesson) => !linkedLessonIds.has(lesson._id));
  const availableQuizzes = quizzes.filter((quiz) => !linkedQuizIds.has(quiz._id));

  if (loading) {
    return <Loader label="Chargement des sections..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Structuration du cours"
        title="Sections du cours"
        description="Organisez vos cours en sections claires, puis rattachez-y les lecons et quiz de chapitre."
        actions={
          <div className="flex flex-wrap gap-3">
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              value={selectedCourse}
              onChange={async (event) => {
                const value = event.target.value;
                setSelectedCourse(value);
                setError("");
                try {
                  const nextSectionId = await loadSections(value);
                  await loadBuilderData(value, nextSectionId);
                } catch (changeError) {
                  console.error(changeError);
                  setError("Impossible de charger les sections de ce cours.");
                }
              }}
            >
              <option value="">Selectionner un cours</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedCourse}
              onClick={() => {
                setEditing(null);
                setForm({
                  ...initialForm,
                  order: sections.length + 1
                });
                setOpen(true);
              }}
            >
              Nouvelle section
            </button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : null}

      {!courses.length ? (
        <div className="glass-card rounded-[32px] p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-950">Aucun cours disponible</h3>
          <p className="mt-2 text-sm text-slate-500">Vous devez etre affecte a au moins un cours pour organiser ses sections.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Sections" value={sections.length} hint="Dans le cours selectionne" accent="bg-blue-500" />
            <StatCard title="Cours" value={courses.find((course) => course._id === selectedCourse)?.title || "-"} hint="Support pedagogique" accent="bg-cyan-500" />
            <StatCard title="Ordre max" value={Math.max(0, ...sections.map((section) => section.order || 0))} hint="Sequence actuelle" accent="bg-violet-500" />
          </div>

          <div className="glass-card p-5">
            <DataTable
              columns={[
                { key: "title", label: "Section", sortable: true },
                { key: "description", label: "Description", render: (row) => row.description || "-" },
                { key: "order", label: "Ordre", sortable: true },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="flex gap-2">
                      <button
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                        onClick={() => {
                          setEditing(row);
                          setForm({ title: row.title || "", description: row.description || "", order: row.order || 1 });
                          setOpen(true);
                        }}
                      >
                        Modifier
                      </button>
                      <button className="rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-700" onClick={() => setSelectedSectionId(row._id)}>
                        Builder
                      </button>
                      <button
                        className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700"
                        onClick={async () => {
                          await resourceService.delete(`/sections/${row._id}`);
                          const nextSectionId = await loadSections(selectedCourse);
                          await loadBuilderData(selectedCourse, nextSectionId);
                        }}
                      >
                        Supprimer
                      </button>
                    </div>
                  )
                }
              ]}
              rows={sections}
              emptyMessage="Aucune section pour ce cours."
            />
          </div>

          {currentSection ? (
            <div className="glass-card space-y-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-brand-500">Builder pedagogique</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">{currentSection.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Une seule sequence ordonnee d'items lecon et quiz pour cette section.</p>
                </div>
              </div>

              {builderLoading ? <Loader label="Chargement du builder..." /> : null}

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Items de la section</h4>
                  <div className="mt-4 space-y-3">
                    {sectionItems.length ? (
                      sectionItems.map((item) => (
                        <div key={item._id} className="rounded-2xl border border-slate-200 px-4 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                {item.type === "lesson" ? "Lecon" : "Quiz"} - ordre {item.order}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{item.lesson?.title || item.quiz?.title || "Item"}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                                onClick={async () => {
                                  await resourceService.put(`/section-items/${item._id}`, { order: Math.max(1, item.order - 1) });
                                  await loadBuilderData(selectedCourse, selectedSectionId);
                                }}
                              >
                                Monter
                              </button>
                              <button
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                                onClick={async () => {
                                  await resourceService.put(`/section-items/${item._id}`, { order: item.order + 1 });
                                  await loadBuilderData(selectedCourse, selectedSectionId);
                                }}
                              >
                                Descendre
                              </button>
                              <button
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                                onClick={async () => {
                                  await resourceService.put(`/section-items/${item._id}`, { isRequired: !item.isRequired });
                                  await loadBuilderData(selectedCourse, selectedSectionId);
                                }}
                              >
                                {item.isRequired ? "Obligatoire" : "Optionnel"}
                              </button>
                              <button
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                                onClick={async () => {
                                  await resourceService.put(`/section-items/${item._id}`, { isPublished: !item.isPublished });
                                  await loadBuilderData(selectedCourse, selectedSectionId);
                                }}
                              >
                                {item.isPublished ? "Publie" : "Masque"}
                              </button>
                              <button
                                className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700"
                                onClick={async () => {
                                  await resourceService.delete(`/section-items/${item._id}`);
                                  await loadBuilderData(selectedCourse, selectedSectionId);
                                }}
                              >
                                Retirer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">Aucun item ordonne pour cette section.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ajouter une lecon existante</h4>
                    <div className="mt-4 space-y-2">
                      {availableLessons.length ? (
                        availableLessons.map((lesson) => (
                          <div key={lesson._id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{lesson.title}</p>
                            </div>
                            <button
                              className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white"
                              onClick={async () => {
                                await resourceService.post("/section-items", {
                                  section: selectedSectionId,
                                  type: "lesson",
                                  lesson: lesson._id,
                                  order: sectionItems.length + 1,
                                  isRequired: true,
                                  isPublished: lesson.isPublished !== false
                                });
                                await loadBuilderData(selectedCourse, selectedSectionId);
                              }}
                            >
                              Ajouter
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Toutes les lecons de cette section sont deja dans la sequence.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 p-4">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Ajouter un quiz existant</h4>
                    <div className="mt-4 space-y-2">
                      {availableQuizzes.length ? (
                        availableQuizzes.map((quiz) => (
                          <div key={quiz._id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{quiz.title}</p>
                            </div>
                            <button
                              className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white"
                              onClick={async () => {
                                await resourceService.post("/section-items", {
                                  section: selectedSectionId,
                                  type: "quiz",
                                  quiz: quiz._id,
                                  order: sectionItems.length + 1,
                                  isRequired: quiz.isRequired !== false,
                                  isPublished: quiz.published !== false
                                });
                                await loadBuilderData(selectedCourse, selectedSectionId);
                              }}
                            >
                              Ajouter
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Tous les quiz de cette section sont deja dans la sequence.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : sections.length ? (
            <div className="glass-card rounded-[32px] p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-950">Selectionnez une section</h3>
              <p className="mt-2 text-sm text-slate-500">Choisissez une section dans le tableau pour organiser ses items pedagogiques.</p>
            </div>
          ) : (
            <div className="glass-card rounded-[32px] p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-950">Aucune section pour ce cours</h3>
              <p className="mt-2 text-sm text-slate-500">Creez votre premiere section pour commencer a structurer le cours.</p>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Modifier une section" : "Nouvelle section"}>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const payload = { ...form, course: selectedCourse };
            if (editing) {
              await resourceService.put(`/sections/${editing._id}`, payload);
            } else {
              await resourceService.post("/sections", payload);
            }
            setOpen(false);
            setEditing(null);
            setForm(initialForm);
            const nextSectionId = await loadSections(selectedCourse);
            await loadBuilderData(selectedCourse, nextSectionId);
          }}
          className="space-y-4"
        >
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Titre"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            required
          />
          <textarea
            className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            type="number"
            min="1"
            placeholder="Ordre"
            value={form.order}
            onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))}
            required
          />
          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">{editing ? "Mettre a jour" : "Creer la section"}</button>
        </form>
      </Modal>
    </div>
  );
};
