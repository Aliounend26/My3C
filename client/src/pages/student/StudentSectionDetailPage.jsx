import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";

const getErrorMessage = (error) => {
  if (error?.response?.status === 403) {
    return "Vous n'avez pas acces a ce contenu.";
  }

  return error?.response?.data?.message || error?.message || "Impossible de charger cette section.";
};

export const StudentSectionDetailPage = () => {
  const { sectionId } = useParams();
  const [section, setSection] = useState(undefined);
  const [items, setItems] = useState([]);
  const [resources, setResources] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const renderSectionItem = (item) => {
    const lessonId = item.lesson?._id || item.lesson;

    if (item.type === "lesson") {
      return (
        <Link key={item._id} to={lessonId ? `/student/lessons/${lessonId}` : "#"} className="block rounded-3xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Lecon · ordre {item.order}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{item.lesson?.title}</p>
          <p className="mt-1 text-sm text-slate-600">{item.lesson?.description || "Lecon pedagogique."}</p>
        </Link>
      );
    }

    return (
      <Link key={item._id} to={`/student/quizzes/${item.quiz?._id || item.quiz}`} className="block rounded-3xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quiz · ordre {item.order}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{item.quiz?.title}</p>
        <p className="mt-1 text-sm text-slate-600">{item.quiz?.description || "Evaluation associee a cette section."}</p>
      </Link>
    );
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const sections = await resourceService.get("/sections");
        const currentSection = sections.find((item) => item._id === sectionId);
        setSection(currentSection || null);

        if (!currentSection) return;

        const [itemsData, resourcesData, videosData] = await Promise.all([
          resourceService.get(`/sections/${sectionId}/items`),
          resourceService.get(`/resources?section=${sectionId}`),
          resourceService.get(`/videos?section=${sectionId}`)
        ]);

        setItems(itemsData);
        setResources(resourcesData);
        setVideos(videosData);
      } catch (loadError) {
        console.error("Erreur chargement de la section :", loadError);
        setSection(null);
        setItems([]);
        setResources([]);
        setVideos([]);
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [sectionId]);

  if (loading) return <Loader label="Chargement de la section..." />;
  if (error) return <EmptyState title="Erreur de chargement" description={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Section du cours"
        title={section?.title || "Section"}
        description={section?.description || "Consultez les lecons, ressources, videos et quiz rattaches a cette section."}
        actions={
          section?.course ? (
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to={`/student/courses/${section.course._id || section.course}`}>
              Retour au cours
            </Link>
          ) : null
        }
      />

      {section ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Parcours pedagogique</h3>
            {items.length ? (
              <div className="space-y-3">
                {items.map(renderSectionItem)}
              </div>
            ) : (
              <EmptyState title="Aucun item" description="Cette section ne contient pas encore d'items pedagogiques." />
            )}
          </section>

          <section className="glass-card p-5">
            <h3 className="mb-4 text-lg font-semibold text-slate-950">Ressources et videos</h3>
            <div className="space-y-3">
              {resources.map((resource) => (
                <a key={resource._id} href={resource.url || resource.filePath} target="_blank" rel="noreferrer" className="block rounded-3xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{resource.type}</p>
                </a>
              ))}
              {videos.map((video) => (
                <div key={video._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{video.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{video.description || "Video pedagogique integree."}</p>
                </div>
              ))}
              {!resources.length && !videos.length ? <EmptyState title="Aucun contenu annexe" description="Aucune ressource ou video n'est publiee pour cette section." /> : null}
            </div>
          </section>
        </div>
      ) : (
        <EmptyState title="Section introuvable" description="Cette section n'est pas accessible depuis votre espace etudiant." />
      )}
    </div>
  );
};
