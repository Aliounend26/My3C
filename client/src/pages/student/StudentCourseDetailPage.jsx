import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { resourceService } from "../../services/resourceService";

const getErrorMessage = (error) => {
  if (error?.response?.status === 403) {
    return "Vous n'avez pas acces a ce contenu.";
  }

  return error?.response?.data?.message || error?.message || "Impossible de charger ce cours.";
};

const getPlainTextPreview = (html) => {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const formatSession = (session) => `${session.date} · ${session.startTime} - ${session.endTime}`;

export const StudentCourseDetailPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [items, setItems] = useState([]);
  const [resources, setResources] = useState([]);
  const [videos, setVideos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [results, setResults] = useState([]);
  const [sectionProgress, setSectionProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [courseResult, sectionsResult, resourcesResult, videosResult, announcementsResult, resultsResult, progressResult] = await Promise.allSettled([
          resourceService.get(`/courses/groups/${courseId}`),
          resourceService.get(`/sections?course=${courseId}`),
          resourceService.get(`/resources?course=${courseId}`),
          resourceService.get(`/videos?course=${courseId}`),
          resourceService.get(`/announcements?course=${courseId}`),
          resourceService.get("/quizzes/results"),
          resourceService.get(`/student/progress/sections?course=${courseId}`)
        ]);

        if (courseResult.status !== "fulfilled") throw courseResult.reason;
        if (sectionsResult.status !== "fulfilled") throw sectionsResult.reason;

        const nextCourse = courseResult.value;
        const nextSections = sectionsResult.value;

        setCourse(nextCourse);
        setSections(nextSections);
        setResources(resourcesResult.status === "fulfilled" ? resourcesResult.value : []);
        setVideos(videosResult.status === "fulfilled" ? videosResult.value : []);
        setAnnouncements(announcementsResult.status === "fulfilled" ? announcementsResult.value : []);
        setResults(resultsResult.status === "fulfilled" ? resultsResult.value : []);
        setSectionProgress(progressResult.status === "fulfilled" ? progressResult.value : []);
        setSelectedSectionId(nextSections[0]?._id || "");
      } catch (loadError) {
        console.error("Erreur chargement du cours :", loadError);
        setCourse(null);
        setSections([]);
        setSelectedSectionId("");
        setItems([]);
        setResources([]);
        setVideos([]);
        setAnnouncements([]);
        setResults([]);
        setSectionProgress([]);
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadData();
    }
  }, [courseId]);

  useEffect(() => {
    if (!selectedSectionId) {
      setItems([]);
      return;
    }

    resourceService
      .get(`/sections/${selectedSectionId}/items`)
      .then(setItems)
      .catch((loadError) => {
        console.error("Erreur chargement des items de section :", loadError);
        setItems([]);
      });
  }, [selectedSectionId]);

  const selectedSection = useMemo(() => sections.find((section) => section._id === selectedSectionId) || null, [sections, selectedSectionId]);

  const filteredResources = useMemo(
    () => resources.filter((resource) => !selectedSectionId || resource.section?._id === selectedSectionId || resource.section === selectedSectionId),
    [resources, selectedSectionId]
  );

  const filteredVideos = useMemo(
    () => videos.filter((video) => !selectedSectionId || video.section?._id === selectedSectionId || video.section === selectedSectionId),
    [videos, selectedSectionId]
  );

  const sectionQuizIds = useMemo(
    () => items.filter((item) => item.type === "quiz" && item.quiz?._id).map((item) => item.quiz._id),
    [items]
  );

  const courseProgress = useMemo(() => {
    if (!sectionQuizIds.length) return 35;
    const quizIds = new Set(sectionQuizIds);
    const completed = results.filter((result) => quizIds.has(result.quiz?._id));
    return Math.min(100, Math.round((completed.length / Math.max(sectionQuizIds.length, 1)) * 60) + 40);
  }, [sectionQuizIds, results]);

  if (loading) return <Loader label="Chargement du cours..." />;
  if (error) return <EmptyState title="Erreur de chargement" description={error} />;
  if (!course) return <EmptyState title="Cours introuvable" description="Ce cours n'a pas pu etre charge." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mon cours"
        title={course.title}
        description={course.description || "Consultez les sections, lecons, supports, videos, quiz et annonces de ce parcours."}
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="glass-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{course.formation?.name || "Formation"}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">{course.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Formateur: {course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : course.instructor || "Non renseigne"}
              </p>
            </div>
            <div className="min-w-[220px] rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Progression du cours</p>
              <div className="mt-4">
                <ProgressBadge rate={courseProgress} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{sections.length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sections</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{items.length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Items</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{videos.length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Videos</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{items.filter((item) => item.type === "quiz").length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quiz</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-950">Seances associees</h3>
          <div className="mt-4 space-y-3">
            {course.sessions?.length ? (
              course.sessions.slice(0, 5).map((session) => (
                <div key={session._id} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{session.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{formatSession(session)}</p>
                </div>
              ))
            ) : (
              <EmptyState title="Aucune seance" description="Aucune seance n'est encore planifiee pour ce cours." />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <aside className="glass-card p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">Sections du cours</h3>
          <div className="space-y-3">
            {sections.length ? (
              sections.map((section) => {
                const progress = sectionProgress.find((item) => item._id === section._id);
                return (
                  <button
                    key={section._id}
                    onClick={() => setSelectedSectionId(section._id)}
                    className={`w-full rounded-2xl px-4 py-4 text-left transition ${
                      selectedSectionId === section._id ? "bg-brand-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold">{section.title}</p>
                    <p className={`mt-1 text-sm ${selectedSectionId === section._id ? "text-blue-50" : "text-slate-500"}`}>
                      {section.description || "Section pedagogique du cours."}
                    </p>
                    <p className={`mt-2 text-xs uppercase tracking-[0.16em] ${selectedSectionId === section._id ? "text-blue-100" : "text-slate-400"}`}>
                      {progress?.itemsCompleted || 0}/{progress?.totalItems || 0} items termines
                    </p>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">Aucune section disponible.</p>
            )}
          </div>
        </aside>

        <main className="space-y-6">
          {selectedSection ? (
            <>
              <section className="glass-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.16em] text-brand-500">Section selectionnee</p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">{selectedSection.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {selectedSection.description || "Parcours de contenus pedagogiques et d'exercices."}
                    </p>
                  </div>
                  <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to={`/student/sections/${selectedSection._id}`}>
                    Voir la section
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {items.length ? (
                    items.map((item) => {
                      const lessonId = item.lesson?._id || item.lesson;

                      return item.type === "lesson" ? (
                        <Link
                          key={item._id}
                          to={lessonId ? `/student/lessons/${lessonId}` : "#"}
                          className="block rounded-3xl border border-slate-200 px-4 py-4 transition hover:border-brand-500 hover:bg-slate-50"
                        >
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Lecon · ordre {item.order}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{item.lesson?.title}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.lesson?.description || getPlainTextPreview(item.lesson?.content) || "Lecon disponible dans votre parcours."}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{item.lesson?.estimatedMinutes || 0} min</p>
                        </Link>
                      ) : (
                        <Link
                          key={item._id}
                          to={`/student/quizzes/${item.quiz?._id || item.quiz}`}
                          className="block rounded-3xl border border-slate-200 px-4 py-4 transition hover:border-brand-500 hover:bg-slate-50"
                        >
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quiz · ordre {item.order}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{item.quiz?.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.quiz?.description || "Evaluation integree a cette section."}</p>
                        </Link>
                      );
                    })
                  ) : (
                    <EmptyState title="Aucun item" description="Cette section ne contient pas encore d'item consultable." />
                  )}
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <div className="glass-card p-5">
                  <h3 className="mb-4 text-lg font-semibold text-slate-950">Supports de cours</h3>
                  {filteredResources.length ? (
                    <div className="space-y-3">
                      {filteredResources.map((resource) => (
                        <a
                          key={resource._id}
                          href={resource.url || resource.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50"
                        >
                          <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{resource.lesson?.title || selectedSection.title}</p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Aucun support" description="Aucun support de cours n'est encore publie pour cette section." />
                  )}
                </div>

                <div className="glass-card p-5">
                  <h3 className="mb-4 text-lg font-semibold text-slate-950">Videos integrees</h3>
                  {filteredVideos.length ? (
                    <div className="space-y-4">
                      {filteredVideos.map((video) => (
                        <div key={video._id} className="overflow-hidden rounded-3xl border border-slate-200">
                          <div className="aspect-video bg-slate-900">
                            <iframe
                              width="100%"
                              height="100%"
                              src={video.embedUrl}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={video.title}
                            />
                          </div>
                          <div className="p-4">
                            <p className="text-sm font-semibold text-slate-900">{video.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{video.description || "Video pedagogique integree au parcours."}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="Aucune video" description="Aucune video integree pour cette section." />
                  )}
                </div>
              </section>

              <section className="glass-card p-5">
                <h3 className="mb-4 text-lg font-semibold text-slate-950">Annonces du cours</h3>
                {announcements.length ? (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div key={announcement._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                        <p className="text-sm font-semibold text-slate-900">{announcement.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{announcement.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Aucune annonce" description="Les annonces du formateur apparaitront ici." />
                )}
              </section>
            </>
          ) : (
            <EmptyState title="Selectionnez une section" description="Choisissez une section pour afficher les lecons et contenus pedagogiques." />
          )}
        </main>
      </section>
    </div>
  );
};
