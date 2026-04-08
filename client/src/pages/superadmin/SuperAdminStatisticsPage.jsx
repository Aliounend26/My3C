import { useEffect, useState } from "react";
import { AttendanceOverviewChart } from "../../components/charts/AttendanceOverviewChart";
import { MonthlyPresenceChart } from "../../components/charts/MonthlyPresenceChart";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

export const SuperAdminStatisticsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    resourceService.get("/dashboard/superadmin").then(setData);
  }, []);

  if (!data) return <Loader label="Chargement des statistiques globales..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytique globale"
        title="Statistiques SuperAdmin"
        description="Analysez les performances par formation, cours, formateur et presence pour piloter toute la plateforme."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <MonthlyPresenceChart data={data.attendance.monthly} />
        <AttendanceOverviewChart
          data={[
            { name: "Present", rate: data.attendance.present },
            { name: "Retard", rate: data.attendance.late },
            { name: "Absent", rate: data.attendance.absent }
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Statistiques par formation</h3>
          {data.formationStats.length ? (
            <DataTable
              columns={[
                { key: "name", label: "Formation", sortable: true },
                { key: "students", label: "Etudiants", sortable: true },
                { key: "courses", label: "Cours", sortable: true },
                { key: "rate", label: "Taux de presence", sortable: true, render: (row) => `${row.rate}%` }
              ]}
              rows={data.formationStats}
            />
          ) : (
            <EmptyState title="Aucune formation" description="Les statistiques apparaitront ici des que des formations seront actives." />
          )}
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Statistiques par formateur</h3>
          {data.teacherStats.length ? (
            <DataTable
              columns={[
                { key: "name", label: "Formateur", sortable: true },
                { key: "courses", label: "Cours", sortable: true },
                { key: "quizzes", label: "Quiz", sortable: true },
                { key: "averageQuizRate", label: "Moyenne quiz", sortable: true, render: (row) => `${Math.round(row.averageQuizRate)}%` }
              ]}
              rows={data.teacherStats}
            />
          ) : (
            <EmptyState title="Aucun formateur" description="Les performances des formateurs apparaitront ici." />
          )}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-950">Statistiques par cours</h3>
        {data.courseStats.length ? (
          <DataTable
            columns={[
              { key: "title", label: "Cours", sortable: true },
              { key: "teacherName", label: "Formateur", sortable: true },
              { key: "students", label: "Etudiants", sortable: true },
              { key: "sections", label: "Sections", sortable: true },
              { key: "resources", label: "Supports", sortable: true },
              { key: "quizzes", label: "Quiz", sortable: true },
              { key: "averageQuizRate", label: "Moyenne quiz", sortable: true, render: (row) => `${Math.round(row.averageQuizRate)}%` }
            ]}
            rows={data.courseStats}
          />
        ) : (
          <EmptyState title="Aucun cours" description="Les statistiques de cours apparaitront ici une fois les parcours structures." />
        )}
      </div>
    </div>
  );
};
