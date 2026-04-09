import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { RichTextContent } from "../../components/common/RichTextContent";
import { resourceService } from "../../services/resourceService";
import { getYoutubeEmbedUrl } from "../../utils/media";

const getErrorMessage = (err) => {
  if (err?.response?.status === 403) {
    return "Vous n'avez pas accès à ce contenu";
  }
  return err?.response?.data?.message || err?.message || "Impossible de charger cette leçon.";
};

const ItemIcon = ({ type, isCompleted }) => {
  if (type === "quiz") {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 10h6" />
          <path d="M9 14h6" />
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-2xl ${isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"}`}>
      {isCompleted ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l6-6a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      ) : (
        <span className="text-xs font-semibold">L</span>
      )}
    </span>
  );
};

const getItemTitle = (item) => {
  if (item.type === "quiz") return item.quiz?.title || "Quiz";
  return item.lesson?.title || "Leçon";
};

const getItemLink = (item) => {
  if (item.type === "quiz") return `/student/quizzes/${item.quiz?._id || item.quiz}`;
  return `/student/lessons/${item.lesson?._id || item.lesson}`;
};

export const StudentLessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionItems, setSectionItems] = useState([]);
  const [courseProgress, setCourseProgress] = useState(null);
  const [sectionProgress, setSectionProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const lessonData = await resourceService.get(`/lessons/${lessonId}`);
        setLesson(lessonData);

        if (lessonData?.course?._id) {
          const [sectionsData, progressData, sectionData] = await Promise.all([
            resourceService.get(`/sections?course=${lessonData.course._id}`),
            resourceService.get(`/student/progress/courses/${lessonData.course._id}/progress`),
            resourceService.get(`/student/progress/sections?course=${lessonData.course._id}`)
          ]);

          setSections(sectionsData);
          setCourseProgress(progressData);
          const currentSection = sectionData.find((section) => section._id === (lessonData.section?._id || lessonData.section));
          setSectionProgress(currentSection || null);
          setExpandedSections({ [lessonData.section?._id || lessonData.section]: true });
        }

        if (lessonData?.section?._id || lessonData?.section) {
          const itemsData = await resourceService.get(`/section-items?section=${lessonData.section?._id || lessonData.section}`);
          setSectionItems(itemsData);
        }
      } catch (err) {
        console.error("Erreur chargement de la leçon :", err);
        setLesson(null);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [lessonId]);

  const currentItemIndex = useMemo(
    () => sectionItems.findIndex(
      (item) => item.type === "lesson" && (item.lesson?._id || item.lesson)?.toString() === lessonId
    ),
    [lessonId, sectionItems]
  );

  const previousItem = currentItemIndex > 0 ? sectionItems[currentItemIndex - 1] : null;
  const nextItem = currentItemIndex < sectionItems.length - 1 ? sectionItems[currentItemIndex + 1] : null;

  const markAsComplete = async () => {
    if (!lesson) return;
    setMarking(true);
    try {
      const response = await resourceService.post("/student/progress/complete-lesson", { lessonId: lesson._id });
      if (response.courseProgress) setCourseProgress(response.courseProgress);
      if (response.sectionProgress) setSectionProgress(response.sectionProgress);
    } finally {
      setMarking(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  if (loading) return <Loader label="Chargement de la leçon..." />;
  if (error) return <EmptyState title="Erreur de chargement" description={error} />;
  if (!lesson) return <EmptyState title="Leçon introuvable" description="Cette leçon n'est pas accessible ou n'existe plus." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <div className="sticky top-0 z-20 border-b border-white/80 bg-white/95 backdrop-blur-xl shadow-sm shadow-slate-200/50">
        <div className="flex w-full items-center justify-between px-6 py-4 lg:px-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{lesson.course?.title}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{lesson.title}</h1>
          </div>
          <Link
            to={`/student/courses/${lesson.course?._id || lesson.course}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-brand-50"
          >
            ← Retour au cours
          </Link>
        </div>
      </div>

      <main className="flex w-full gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden lg:block flex-shrink-0 w-[280px] space-y-6">
          <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-lg shadow-slate-200/10 backdrop-blur-xl">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Plan du cours</p>
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
                    <button
                      onClick={() => toggleSection(section._id)}
                      className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-800 transition hover:text-brand-600"
                    >
                      <span>{section.title}</span>
                      <svg
                        className={`h-4 w-4 transition-transform ${expandedSections[section._id] ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                    {expandedSections[section._id] && (
                      <div className="mt-3 space-y-2 rounded-3xl bg-white p-3 shadow-sm">
                        {section._id === (lesson.section?._id || lesson.section) ? (
                          sectionItems.map((item) => (
                            <button
                              key={item._id}
                              onClick={() => navigate(getItemLink(item))}
                              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition ${
                                (item.type === "lesson" ? item.lesson?._id : item.quiz?._id)?.toString() === lessonId
                                  ? "bg-brand-500/10 text-brand-700"
                                  : "text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <ItemIcon type={item.type} isCompleted={courseProgress?.completedLessonIds?.includes(item.lesson?._id || item.lesson)} />
                              <span className="truncate">{getItemTitle(item)}</span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500">Ouvrez la section actuelle pour voir les leçons.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <div className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/10">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-start">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.32em] text-slate-500">
                  Leçon
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{lesson.title}</h2>
                  <p className="max-w-none text-sm leading-7 text-slate-600">{lesson.description || "Approfondissez chaque notion avec une présentation claire et structurée."}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Chapitre</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.section?.title || "Section"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Durée</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.estimatedMinutes || 5} min</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Cours</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.course?.title || "—"}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Progression de la section</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${sectionProgress?.progressPercent ?? 0}%` }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{sectionProgress?.progressPercent ?? 0}% complété</p>
                    <p className="text-sm text-slate-600">{sectionProgress?.itemsCompleted ?? 0}/{sectionProgress?.totalItems ?? 0} éléments terminés</p>
                  </div>
                  <div className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                    {sectionProgress?.isCompleted ? "Section terminée" : "Continuez votre progression"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/10">
            <div className="space-y-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Contenu de la leçon</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-950">Lecture immersive</h2>
                </div>
                <Link
                  to={`/student/courses/${lesson.course?._id || lesson.course}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-brand-50"
                >
                  Retour au cours
                </Link>
              </div>

              {lesson.youtubeEmbedUrl && (
                <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900">
                  <div className="aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={getYoutubeEmbedUrl(lesson.youtubeEmbedUrl)}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={lesson.title}
                    />
                  </div>
                </figure>
              )}

              <div className="prose prose-slate prose-headings:font-semibold prose-headings:text-slate-950 prose-p:leading-8 prose-p:text-slate-700 prose-strong:text-slate-900 prose-a:text-brand-600 prose-a:underline prose-li:mt-2 prose-blockquote:border-slate-200 prose-blockquote:bg-slate-50 max-w-none">
                <RichTextContent html={lesson.content} className="lesson-content" emptyLabel="Le contenu de cette leçon sera disponible prochainement." />
              </div>

              {lesson.image && (
                <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  <img src={lesson.image} alt={lesson.title} className="w-full object-cover" />
                </figure>
              )}

              {lesson.attachments?.length > 0 && (
                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Ressources téléchargeables</p>
                      <p className="text-sm text-slate-600">Téléchargez les supports associés à cette leçon.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{lesson.attachments.length} fichiers</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {lesson.attachments.map((attachment) => (
                      <a
                        key={attachment}
                        href={attachment}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-brand-500 hover:bg-brand-50"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">📄</span>
                        <span className="truncate">{attachment}</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Auteur</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.teacher?.firstName} {lesson.teacher?.lastName}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Section</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.section?.title || "—"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Cours</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.course?.title || "—"}</p>
                </div>
              </div>

<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <button
                  onClick={markAsComplete}
                  disabled={marking}
                  className="inline-flex min-w-[240px] items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-300/40 transition hover:from-rose-700 hover:to-red-700 disabled:cursor-not-allowed disabled:from-rose-500 disabled:to-red-500 disabled:text-white disabled:opacity-100"
                >
                  <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.07 7.07a1 1 0 01-1.415 0L3.296 8.85a1 1 0 111.414-1.414l4.216 4.216 6.363-6.362a1 1 0 011.415 0z" clipRule="evenodd" />
                  </svg>
                  <span>{marking ? "Enregistrement..." : "Marquer comme terminé"}</span>
                </button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {previousItem && (
                    <button
                      onClick={() => navigate(getItemLink(previousItem))}
                      className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:bg-slate-50 transition"
                    >
                      ← {getItemTitle(previousItem)}
                    </button>
                  )}
                  {nextItem && (
                    <button
                      onClick={() => navigate(getItemLink(nextItem))}
                      className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:bg-slate-50 transition"
                    >
                      {getItemTitle(nextItem)} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </article>
        </section>

        <aside className="hidden lg:block flex-shrink-0 w-[320px] space-y-6">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Progression du cours</p>
                <div className="space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${courseProgress?.progressPercent ?? 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{courseProgress?.completedLessons ?? 0}/{courseProgress?.totalLessons ?? 0} leçons</span>
                    <span className="font-semibold text-slate-900">{courseProgress?.progressPercent ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {sectionProgress && (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Section actuelle</p>
                  <div className="space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Éléments complétés</span>
                      <span className="font-semibold text-slate-900">{sectionProgress.itemsCompleted}/{sectionProgress.totalItems}</span>
                    </div>
                    {sectionProgress.totalRequiredItems > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Éléments requis</span>
                        <span className="font-semibold text-slate-900">{sectionProgress.requiredItemsCompleted}/{sectionProgress.totalRequiredItems}</span>
                      </div>
                    )}
                    <div className="rounded-3xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
                      {sectionProgress.isCompleted ? "Terminée" : "En cours"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Infos rapides</p>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start justify-between">
                    <span className="font-semibold">Section</span>
                    <span className="text-right font-medium">{lesson.section?.title || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold">Cours</span>
                    <span className="text-right font-medium">{lesson.course?.title || "—"}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="font-semibold">Sections</span>
                    <span className="text-right font-medium">{sections.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};
