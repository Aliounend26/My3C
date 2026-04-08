import { useEffect, useState } from "react";
import { AttendanceOverviewChart } from "../../components/charts/AttendanceOverviewChart";
import { MonthlyPresenceChart } from "../../components/charts/MonthlyPresenceChart";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { StatCard } from "../../components/common/StatCard";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";
import { getCourseTypeLabel } from "../../utils/courseType";

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    resourceService.get("/dashboard/admin").then(setData);
  }, []);

  if (!data) return <Loader label="Chargement du dashboard administrateur..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pilotage operationnel"
        title="Dashboard Admin"
        description="Suivez les etudiants, les formateurs, les classes, les cours et les derniers mouvements de presence de l'etablissement."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Etudiants" value={data.cards.students} hint="Comptes apprenants" accent="bg-blue-500" />
        <StatCard title="Formateurs" value={data.cards.teachers} hint="Encadrement" accent="bg-violet-500" />
        <StatCard title="Classes" value={data.cards.classes} hint="Organisation" accent="bg-orange-500" />
        <StatCard title="Formations" value={data.cards.formations} hint="Parcours" accent="bg-cyan-500" />
        <StatCard title="Cours" value={data.cards.courses} hint="Cours structures" accent="bg-emerald-500" />
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Taux global de presence</p>
          <div className="mt-4">
            <ProgressBadge rate={data.cards.globalRate} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AttendanceOverviewChart data={data.byFormation} />
        <MonthlyPresenceChart data={data.monthlyPresence} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Etudiants les plus assidus</h3>
          <DataTable
            columns={[
              { key: "fullName", label: "Etudiant" },
              { key: "formation", label: "Formation" },
              { key: "rate", label: "Taux", render: (row) => `${row.rate}%` }
            ]}
            rows={data.topStudents}
          />
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Etudiants absents recents</h3>
          {data.recentAbsences.length ? (
            <DataTable
            columns={[
              { key: "student", label: "Etudiant", render: (row) => `${row.student?.firstName || ""} ${row.student?.lastName || ""}`.trim() },
              { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
              { key: "formation", label: "Formation", render: (row) => row.formation?.name || "-" },
              { key: "scannedAt", label: "Date", render: (row) => new Date(row.scannedAt).toLocaleString("fr-FR") }
            ]}
            rows={data.recentAbsences}
            />
          ) : (
            <EmptyState title="Aucune absence recente" description="Aucune absence n'a ete enregistree dans la periode recente." />
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Cours actifs</h3>
          {data.activeCourses.length ? (
            <DataTable
              columns={[
                { key: "title", label: "Cours" },
                { key: "formation", label: "Formation", render: (row) => row.formation?.name || "-" },
                { key: "teacher", label: "Formateur", render: (row) => row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : row.instructor || "-" },
                { key: "classRoom", label: "Classe", render: (row) => row.classRoom?.name || "-" },
                { key: "sessionCount", label: "Seances", render: (row) => row.sessionCount }
              ]}
              rows={data.activeCourses}
            />
          ) : (
            <EmptyState title="Aucun cours actif" description="Les cours organises apparaitront ici." />
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Presences recentes</h3>
          {data.recentAttendances.length ? (
            <DataTable
              columns={[
                { key: "student", label: "Etudiant", render: (row) => `${row.student?.firstName || ""} ${row.student?.lastName || ""}`.trim() },
                { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
                { key: "status", label: "Statut" },
                { key: "scannedAt", label: "Horodatage", render: (row) => new Date(row.scannedAt).toLocaleString("fr-FR") }
              ]}
              rows={data.recentAttendances}
            />
          ) : (
            <EmptyState title="Aucune presence recente" description="Les declarations de presence apparaitront ici." />
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-950">Seances du jour</h3>
        {data.todayCourses.length ? (
          <DataTable
            columns={[
              { key: "title", label: "Cours" },
              { key: "date", label: "Date" },
              { key: "startTime", label: "Debut" },
              { key: "endTime", label: "Fin" },
              { key: "courseType", label: "Type", render: (row) => getCourseTypeLabel(row) },
              { key: "instructor", label: "Formateur" }
            ]}
            rows={data.todayCourses}
          />
        ) : (
          <EmptyState title="Aucune seance aujourd'hui" description="Le planning du jour est vide pour l'instant." />
        )}
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-950">Activites recentes</h3>
        {data.recentActivities.length ? (
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
        ) : (
          <EmptyState title="Aucune activite" description="Les derniers mouvements operationnels apparaitront ici." />
        )}
      </div>
    </div>
  );
};
