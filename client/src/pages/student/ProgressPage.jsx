import { useEffect, useState } from "react";
import { AttendanceOverviewChart } from "../../components/charts/AttendanceOverviewChart";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { resourceService } from "../../services/resourceService";

export const ProgressPage = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    resourceService.get("/attendances/summary").then(setSummary);
  }, []);

  if (!summary) return <Loader label="Chargement de votre progression..." />;

  const courseBreakdown = summary.attendances.map((attendance) => ({
    name: attendance.course?.title || "Cours",
    rate: attendance.course?.durationHours ? Number(((attendance.presenceHours / attendance.course.durationHours) * 100).toFixed(1)) : 0
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Progression" title="Mes statistiques" description="Suivi visuel de votre taux global et du détail par formation ou séance." />
      <div className="glass-card p-6">
        <ProgressBadge rate={summary.rate} />
      </div>
      <AttendanceOverviewChart data={summary.byFormation.map((item) => ({ name: item.formationName, rate: item.rate }))} />
      <AttendanceOverviewChart data={courseBreakdown} />
    </div>
  );
};
