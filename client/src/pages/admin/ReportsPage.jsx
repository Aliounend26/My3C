import { useEffect, useState } from "react";
import { AttendanceOverviewChart } from "../../components/charts/AttendanceOverviewChart";
import { MonthlyPresenceChart } from "../../components/charts/MonthlyPresenceChart";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

export const ReportsPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    resourceService.get("/dashboard/admin").then(setData);
  }, []);

  if (!data) return <Loader label="Chargement des rapports..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analyse"
        title="Statistiques & rapports"
        description="Analysez les tendances de presence, les formations les plus stables et les cohortes a surveiller."
      />

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
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Etudiants a risque</h3>
          <DataTable
            columns={[
              { key: "fullName", label: "Etudiant" },
              { key: "formation", label: "Formation" },
              { key: "rate", label: "Taux", render: (row) => `${row.rate}%` }
            ]}
            rows={data.lowStudents}
          />
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-950">Absences recentes</h3>
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
          <EmptyState title="Aucune absence recente" description="Aucune absence n'est actuellement remontee dans les rapports." />
        )}
      </div>
    </div>
  );
};
