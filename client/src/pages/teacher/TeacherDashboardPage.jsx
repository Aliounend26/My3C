import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { resourceService } from "../../services/resourceService";

export const TeacherDashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    resourceService.get("/dashboard/teacher").then(setData);
  }, []);

  if (!data) return <Loader label="Chargement du dashboard formateur..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pilotage pedagogique"
        title="Dashboard formateur"
        description="Suivez vos cours actifs, l'activite recente, les quiz, les performances et vos actions prioritaires."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Cours actifs" value={data.cards.courses} hint="Sous votre responsabilite" accent="bg-violet-500" />
        <StatCard title="Etudiants" value={data.cards.students} hint="Dans vos cours" accent="bg-sky-500" />
        <StatCard title="Sections" value={data.cards.sections} hint="Structure pedagogique" accent="bg-blue-500" />
        <StatCard title="Quiz" value={data.cards.quizzes} hint="Evaluations creees" accent="bg-emerald-500" />
        <StatCard title="Reussite moyenne" value={`${Math.round(data.cards.averageSuccessRate)}%`} hint="Sur les quiz termines" accent="bg-amber-500" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Creation rapide</h2>
          <div className="mt-5 grid gap-3">
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to="/teacher/resources">
              Ajouter un support
            </Link>
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to="/teacher/quizzes">
              Creer un quiz
            </Link>
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to="/teacher/announcements">
              Publier une annonce
            </Link>
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to="/teacher/messages">
              Envoyer un message
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-950">Synthese de presence</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <StatCard title="Presents" value={data.attendanceSummary.present} hint="Pointages valides" accent="bg-emerald-500" />
            <StatCard title="Retards" value={data.attendanceSummary.late} hint="Etudiants en retard" accent="bg-orange-500" />
            <StatCard title="Absents" value={data.attendanceSummary.absent} hint="Presences manquantes" accent="bg-rose-500" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Mes cours</h3>
          {data.latestCourses.length ? (
            <div className="space-y-3">
              {data.latestCourses.map((course) => (
                <Link key={course._id} to={`/teacher/courses/${course._id}`} className="block rounded-3xl border border-slate-200 px-4 py-4 hover:bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{course.formation?.name || "-"}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun cours" description="Vos cours apparaitront ici des qu'ils vous seront attribues." />
          )}
        </section>

        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Derniers quiz et performances</h3>
          {data.studentPerformance.length ? (
            <div className="space-y-3">
              {data.studentPerformance.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{item.studentName || "Etudiant"}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.quizTitle}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">
                    {item.score}/{item.maxScore} · {Math.round(item.rate)}%
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun resultat de quiz" description="Les performances de vos etudiants apparaitront ici." />
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Dernieres ressources</h3>
          {data.latestResources.length ? (
            <div className="space-y-3">
              {data.latestResources.map((resource) => (
                <div key={resource._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{resource.course?.title || "Cours"} · {resource.type}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune ressource recente" description="Vos derniers supports apparaitront ici." />
          )}
        </section>

        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Dernieres annonces et messages</h3>
          {data.announcements.length || data.latestMessages.length ? (
            <div className="space-y-3">
              {data.announcements.map((announcement) => (
                <div key={announcement._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{announcement.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{announcement.course?.title || "Cours"}</p>
                </div>
              ))}
              {data.latestMessages.map((message) => (
                <div key={message._id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{message.to?.firstName} {message.to?.lastName}</p>
                  <p className="mt-1 text-sm text-slate-600">{message.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune activite recente" description="Vos annonces et messages recents apparaitront ici." />
          )}
        </section>
      </div>
    </div>
  );
};
