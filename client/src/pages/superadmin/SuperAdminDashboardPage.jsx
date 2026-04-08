import { useEffect, useState } from "react";
import { AttendanceOverviewChart } from "../../components/charts/AttendanceOverviewChart";
import { MonthlyPresenceChart } from "../../components/charts/MonthlyPresenceChart";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { StatCard } from "../../components/common/StatCard";
import { resourceService } from "../../services/resourceService";

const alertStyles = {
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-sky-200 bg-sky-50 text-sky-700"
};

export const SuperAdminDashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    resourceService.get("/dashboard/superadmin").then(setData);
  }, []);

  if (!data) return <Loader label="Chargement du centre de controle..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Centre de controle global"
        title="Dashboard SuperAdmin"
        description="Supervisez les utilisateurs, les activites pedagogiques, la presence, les contenus et les alertes critiques de My 3C."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Utilisateurs" value={data.cards.users} hint="Tous roles confondus" accent="bg-slate-700" />
        <StatCard title="SuperAdmins" value={data.cards.superadmins} hint="Controle total" accent="bg-slate-500" />
        <StatCard title="Admins" value={data.cards.admins} hint="Pilotage operationnel" accent="bg-sky-500" />
        <StatCard title="Formateurs" value={data.cards.teachers} hint="Encadrement" accent="bg-violet-500" />
        <StatCard title="Etudiants" value={data.cards.students} hint="Apprenants" accent="bg-emerald-500" />
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Taux global de presence</p>
          <div className="mt-4">
            <ProgressBadge rate={data.cards.globalRate} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Formations" value={data.cards.formations} hint="Parcours actifs" accent="bg-cyan-500" />
        <StatCard title="Classes" value={data.cards.classes} hint="Groupes pedagogiques" accent="bg-orange-500" />
        <StatCard title="Cours" value={data.cards.courses} hint="Parcours structures" accent="bg-blue-500" />
        <StatCard title="Sections" value={data.cards.sections} hint="Blocs de contenu" accent="bg-indigo-500" />
        <StatCard title="Quiz" value={data.cards.quizzes} hint="Evaluations" accent="bg-fuchsia-500" />
        <StatCard title="Supports" value={data.cards.resources} hint="Ressources publiees" accent="bg-emerald-600" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MonthlyPresenceChart data={data.attendance.monthly} />

        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-slate-950">Alertes systeme</h3>
          {data.alerts.length ? (
            <div className="mt-4 space-y-3">
              {data.alerts.map((alert) => (
                <div key={alert.id} className={`rounded-3xl border px-4 py-4 ${alertStyles[alert.level] || alertStyles.info}`}>
                  <p className="text-sm font-semibold">{alert.title}</p>
                  <p className="mt-1 text-sm">{alert.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune alerte majeure" description="Les indicateurs critiques de la plateforme sont actuellement stables." />
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AttendanceOverviewChart
          data={[
            { name: "Formations", rate: data.cards.formations },
            { name: "Cours", rate: data.cards.courses },
            { name: "Quiz", rate: data.cards.quizzes },
            { name: "Videos", rate: data.cards.videos },
            { name: "Messages", rate: data.cards.messages }
          ]}
        />

        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-slate-950">Presence globale</h3>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-emerald-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-600">Presents</p>
              <p className="mt-2 text-2xl font-bold text-emerald-700">{data.attendance.present}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-600">Retards</p>
              <p className="mt-2 text-2xl font-bold text-amber-700">{data.attendance.late}</p>
            </div>
            <div className="rounded-2xl bg-rose-50 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.16em] text-rose-600">Absences</p>
              <p className="mt-2 text-2xl font-bold text-rose-700">{data.attendance.absent}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-lg font-semibold text-slate-950">Progression pedagogique</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Moyenne globale aux quiz</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{Math.round(data.progression.averageQuizScore)}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Quiz termines</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{data.progression.completedQuizResults}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Videos integrees</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{data.progression.embeddedVideos}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Derniers utilisateurs crees</h3>
          <div className="space-y-3">
            {data.recentUsers.map((user) => (
              <div key={user.id} className="rounded-3xl border border-slate-200 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{user.fullName}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {user.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{user.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Activite recente</h3>
          <div className="space-y-3">
            {data.recentActivities.map((activity) => (
              <div key={activity.id} className="rounded-3xl border border-slate-200 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{activity.type}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{activity.subtitle}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">{new Date(activity.createdAt).toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
