import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

const tabs = [
  { id: "sections", label: "Sections" },
  { id: "lessons", label: "Lecons" },
  { id: "quizzes", label: "Quiz" },
  { id: "resources", label: "Supports" },
  { id: "videos", label: "Videos" },
  { id: "announcements", label: "Annonces" },
  { id: "messages", label: "Messages" }
];

export const SuperAdminContentPage = () => {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("sections");

  useEffect(() => {
    const load = async () => {
      const [sections, lessons, quizzes, resources, videos, announcements, messages] = await Promise.all([
        resourceService.get("/sections"),
        resourceService.get("/lessons"),
        resourceService.get("/quizzes"),
        resourceService.get("/resources"),
        resourceService.get("/videos"),
        resourceService.get("/announcements"),
        resourceService.get("/messages")
      ]);

      setData({ sections, lessons, quizzes, resources, videos, announcements, messages });
    };

    load();
  }, []);

  const rows = data?.[activeTab] || [];
  const stats = useMemo(
    () => ({
      sections: data?.sections.length || 0,
      lessons: data?.lessons.length || 0,
      quizzes: data?.quizzes.length || 0,
      resources: data?.resources.length || 0,
      videos: data?.videos.length || 0,
      announcements: data?.announcements.length || 0,
      messages: data?.messages.length || 0
    }),
    [data]
  );

  if (!data) return <Loader label="Chargement des contenus pedagogiques..." />;

  const tableConfig = {
    sections: {
      columns: [
        { key: "title", label: "Section", sortable: true },
        { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
        { key: "order", label: "Ordre", sortable: true },
        { key: "description", label: "Description", render: (row) => row.description || "-" }
      ]
    },
    lessons: {
      columns: [
        { key: "title", label: "Lecon", sortable: true },
        { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
        { key: "section", label: "Section", render: (row) => row.section?.title || "-" },
        { key: "estimatedMinutes", label: "Minutes", sortable: true }
      ]
    },
    quizzes: {
      columns: [
        { key: "title", label: "Quiz", sortable: true },
        { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
        { key: "durationMinutes", label: "Duree", sortable: true },
        { key: "maxScore", label: "Note max", sortable: true }
      ]
    },
    resources: {
      columns: [
        { key: "title", label: "Support", sortable: true },
        { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
        { key: "section", label: "Section", render: (row) => row.section?.title || "-" },
        { key: "type", label: "Type", sortable: true }
      ]
    },
    videos: {
      columns: [
        { key: "title", label: "Video", sortable: true },
        { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
        { key: "section", label: "Section", render: (row) => row.section?.title || "-" },
        { key: "provider", label: "Source", render: () => "YouTube embed" }
      ]
    },
    announcements: {
      columns: [
        { key: "title", label: "Annonce", sortable: true },
        { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
        { key: "createdAt", label: "Publication", sortable: true, sortValue: (row) => new Date(row.createdAt), render: (row) => new Date(row.createdAt).toLocaleString("fr-FR") }
      ]
    },
    messages: {
      columns: [
        { key: "from", label: "De", render: (row) => row.from ? `${row.from.firstName} ${row.from.lastName}` : "-" },
        { key: "to", label: "A", render: (row) => row.to ? `${row.to.firstName} ${row.to.lastName}` : "-" },
        { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
        { key: "isRead", label: "Lecture", render: (row) => (row.isRead ? "Lu" : "Non lu") }
      ]
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Supervision pedagogique" title="Contenus de la plateforme" description="Controlez les sections, lecons, quiz, supports, videos, annonces et messages publies sur My 3C." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <StatCard title="Sections" value={stats.sections} hint="Structure de cours" accent="bg-indigo-500" />
        <StatCard title="Lecons" value={stats.lessons} hint="Contenus de cours" accent="bg-cyan-500" />
        <StatCard title="Quiz" value={stats.quizzes} hint="Evaluations" accent="bg-fuchsia-500" />
        <StatCard title="Supports" value={stats.resources} hint="Ressources publiees" accent="bg-emerald-500" />
        <StatCard title="Videos" value={stats.videos} hint="Embeds integres" accent="bg-red-500" />
        <StatCard title="Annonces" value={stats.announcements} hint="Communication cours" accent="bg-sky-500" />
        <StatCard title="Messages" value={stats.messages} hint="Messagerie interne" accent="bg-slate-600" />
      </div>

      <div className="glass-card p-5">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button key={tab.id} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {rows.length ? <DataTable columns={tableConfig[activeTab].columns} rows={rows} /> : <EmptyState title="Aucun contenu" description="Aucun element n'est disponible pour cet onglet pour le moment." />}
        </div>
      </div>
    </div>
  );
};
