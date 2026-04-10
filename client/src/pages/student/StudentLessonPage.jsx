import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { LoadingButton } from "../../components/common/LoadingButton";
import { PageHeader } from "../../components/common/PageHeader";
import { RichTextContent } from "../../components/common/RichTextContent";
import { resourceService } from "../../services/resourceService";
import { getYoutubeEmbedUrl } from "../../utils/media";

const getErrorMessage = (err) => {
  if (err?.response?.status === 403) {
    return "Vous n'avez pas acces a ce contenu.";
  }

  return err?.response?.data?.message || err?.message || "Impossible de charger cette lecon.";
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
  return item.lesson?.title || "Lecon";
};

const getItemLink = (item) => {
  if (item.type === "quiz") return `/student/quizzes/${item.quiz?._id || item.quiz}`;
  return `/student/lessons/${item.lesson?._id || item.lesson}`;
};

const QuickInfoCard = ({ title, value }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="font-semibold text-slate-700">{title}</span>
    <span className="text-right font-medium text-slate-900">{value}</span>
  </div>
);

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
        console.error("Erreur chargement de la lecon :", err);
        setLesson(null);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [lessonId]);

  const currentItemIndex = useMemo(
    () =>
      sectionItems.findIndex(
        (item) => item.type === "lesson" && (item.lesson?._id || item.lesson)?.toString() === lessonId
      ),
    [lessonId, sectionItems]
  );

  const previousItem = currentItemIndex > 0 ? sectionItems[currentItemIndex - 1] : null;
  const nextItem = currentItemIndex < sectionItems.length - 1 ? sectionItems[currentItemIndex + 1] : null;
  const currentSectionId = lesson?.section?._id || lesson?.section;

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

  if (loading) return <Loader label="Chargement de la lecon..." />;
  if (error) return <EmptyState title="Erreur de chargement" description={error} />;
  if (!lesson) return <EmptyState title="Lecon introuvable" description="Cette lecon n'est pas accessible ou n'existe plus." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={lesson.course?.title || "Lecon"}
        title={lesson.title}
        description={lesson.description || "Approfondissez chaque notion avec une presentation claire et structuree."}
        actions={
          <Link
            to={`/student/courses/${lesson.course?._id || lesson.course}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-slate-50"
          >
            ← Retour au cours
          </Link>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[280px_minmax(0,1fr)_320px] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Plan du cours</p>
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section._id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
                    <button
                      type="button"
                      onClick={() => toggleSection(section._id)}
                      className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-slate-800 transition hover:text-brand-600"
                    >
                      <span className="min-w-0 truncate">{section.title}</span>
                      <svg
                        className={`h-4 w-4 shrink-0 transition-transform ${expandedSections[section._id] ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>

                    {expandedSections[section._id] ? (
                      <div className="mt-3 space-y-2 rounded-3xl bg-white p-3 shadow-sm">
                        {section._id === currentSectionId ? (
                          sectionItems.map((item) => {
                            const itemId = item.type === "lesson" ? item.lesson?._id || item.lesson : item.quiz?._id || item.quiz;
                            const isCurrentItem = itemId?.toString() === lessonId;
                            const isCompleted = item.type === "lesson" && courseProgress?.completedLessonIds?.includes(item.lesson?._id || item.lesson);

                            return (
                              <button
                                key={item._id}
                                type="button"
                                onClick={() => navigate(getItemLink(item))}
                                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                                  isCurrentItem ? "bg-brand-500/10 text-brand-700" : "text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                <ItemIcon type={item.type} isCompleted={isCompleted} />
                                <span className="min-w-0 truncate">{getItemTitle(item)}</span>
                              </button>
                            );
                          })
                        ) : (
                          <p className="text-xs leading-6 text-slate-500">Ouvrez la section actuelle pour voir les lecons.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/10 xl:p-8">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="min-w-0 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.32em] text-slate-500">
                  Lecon
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">{lesson.title}</h2>
                  <p className="max-w-3xl text-sm leading-7 text-slate-600">
                    {lesson.description || "Approfondissez chaque notion avec une presentation claire et structuree."}
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Chapitre</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 break-words">{lesson.section?.title || "Section"}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Duree</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.estimatedMinutes || 5} min</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Cours</p>
                    <p className="mt-2 text-sm font-semibold text-slate-950 break-words">{lesson.course?.title || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Progression de la section</p>
                  <div className="space-y-2">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${sectionProgress?.progressPercent ?? 0}%` }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{sectionProgress?.progressPercent ?? 0}% complete</p>
                    <p className="text-sm text-slate-600">{sectionProgress?.itemsCompleted ?? 0}/{sectionProgress?.totalItems ?? 0} elements termines</p>
                  </div>
                  <div className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    {sectionProgress?.isCompleted ? "Section terminee" : "Continuez votre progression"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/10 xl:p-8">
            <div className="space-y-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Contenu de la lecon</p>
                  <h2 className="mt-3 text-3xl font-semibold text-slate-950">Lecture immersive</h2>
                </div>
                <Link
                  to={`/student/courses/${lesson.course?._id || lesson.course}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-brand-50"
                >
                  Retour au cours
                </Link>
              </div>

              {lesson.youtubeEmbedUrl ? (
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
              ) : null}

              <div className="max-w-none">
                <RichTextContent html={lesson.content} className="lesson-content" emptyLabel="Le contenu de cette lecon sera disponible prochainement." />
              </div>

              {lesson.image ? (
                <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
                  <img src={lesson.image} alt={lesson.title} className="w-full object-cover" />
                </figure>
              ) : null}

              {lesson.attachments?.length > 0 ? (
                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Ressources telechargeables</p>
                      <p className="text-sm text-slate-600">Telechargez les supports associes a cette lecon.</p>
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
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">PDF</span>
                        <span className="min-w-0 truncate">{attachment}</span>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Auteur</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">{lesson.teacher?.firstName} {lesson.teacher?.lastName}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Section</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 break-words">{lesson.section?.title || "-"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Cours</p>
                  <p className="mt-2 text-sm font-semibold text-slate-950 break-words">{lesson.course?.title || "-"}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <LoadingButton
                  type="button"
                  onClick={markAsComplete}
                  loading={marking}
                  loadingText="Enregistrement..."
                  className="inline-flex items-center justify-center rounded-3xl bg-gradient-to-r from-rose-600 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-300/40 transition hover:from-rose-700 hover:to-red-700 xl:min-w-[240px]"
                >
                  Marquer comme termine
                </LoadingButton>

                <div className="flex flex-col gap-3 lg:flex-row">
                  {previousItem ? (
                    <button
                      type="button"
                      onClick={() => navigate(getItemLink(previousItem))}
                      className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-slate-50"
                    >
                      ← {getItemTitle(previousItem)}
                    </button>
                  ) : null}
                  {nextItem ? (
                    <button
                      type="button"
                      onClick={() => navigate(getItemLink(nextItem))}
                      className="rounded-3xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-slate-50"
                    >
                      {getItemTitle(nextItem)} →
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-6 xl:grid-cols-2 2xl:hidden">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Progression du cours</p>
                <div className="space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${courseProgress?.progressPercent ?? 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{courseProgress?.completedLessons ?? 0}/{courseProgress?.totalLessons ?? 0} lecons</span>
                    <span className="font-semibold text-slate-900">{courseProgress?.progressPercent ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Infos rapides</p>
                <div className="space-y-3 text-sm text-slate-600">
                  <QuickInfoCard title="Section" value={lesson.section?.title || "-"} />
                  <QuickInfoCard title="Cours" value={lesson.course?.title || "-"} />
                  <QuickInfoCard title="Sections" value={sections.length} />
                  {sectionProgress ? (
                    <QuickInfoCard title="Etat" value={sectionProgress.isCompleted ? "Terminee" : "En cours"} />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="hidden 2xl:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Progression du cours</p>
                <div className="space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${courseProgress?.progressPercent ?? 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{courseProgress?.completedLessons ?? 0}/{courseProgress?.totalLessons ?? 0} lecons</span>
                    <span className="font-semibold text-slate-900">{courseProgress?.progressPercent ?? 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {sectionProgress ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Section actuelle</p>
                  <div className="space-y-3 text-sm text-slate-600">
                    <QuickInfoCard title="Elements completes" value={`${sectionProgress.itemsCompleted}/${sectionProgress.totalItems}`} />
                    {sectionProgress.totalRequiredItems > 0 ? (
                      <QuickInfoCard title="Elements requis" value={`${sectionProgress.requiredItemsCompleted}/${sectionProgress.totalRequiredItems}`} />
                    ) : null}
                    <div className="rounded-3xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-700">
                      {sectionProgress.isCompleted ? "Terminee" : "En cours"}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/10">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Infos rapides</p>
                <div className="space-y-3 text-sm text-slate-600">
                  <QuickInfoCard title="Section" value={lesson.section?.title || "-"} />
                  <QuickInfoCard title="Cours" value={lesson.course?.title || "-"} />
                  <QuickInfoCard title="Sections" value={sections.length} />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
