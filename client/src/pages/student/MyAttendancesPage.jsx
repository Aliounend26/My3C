import { useEffect, useMemo, useState } from "react";
import { Keyboard, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { SortSelect } from "../../components/common/SortSelect";
import { StatusPill } from "../../components/common/StatusPill";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";
import { sortRows } from "../../utils/sorting";

export const MyAttendancesPage = () => {
  const [summary, setSummary] = useState(null);
  const [sorter, setSorter] = useState("date-desc");
  const [sessions, setSessions] = useState([]);
  const [manualCourseId, setManualCourseId] = useState("");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [attendanceError, setAttendanceError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSummary = async () => {
    const summaryData = await resourceService.get("/attendances/me");
    setSummary(summaryData);
  };

  useEffect(() => {
    loadSummary();
    resourceService
      .get("/courses")
      .then(setSessions)
      .catch((requestError) => console.error(requestError));
  }, []);

  const sortedRows = useMemo(() => sortRows(summary?.attendances || [], sorter), [summary, sorter]);

  const availableSessions = useMemo(() => {
    const now = new Date();

    return sessions.filter((session) => {
      const startsAt = new Date(`${session.date}T${session.startTime}:00`);
      const endsAt = new Date(`${session.date}T${session.endTime}:00`);
      const opensAt = new Date(startsAt);
      const closesAt = new Date(endsAt);

      opensAt.setMinutes(opensAt.getMinutes() - 30);
      closesAt.setHours(closesAt.getHours() + 1);

      return now >= opensAt && now <= closesAt;
    });
  }, [sessions]);

  useEffect(() => {
    if (!availableSessions.length) {
      setManualCourseId("");
      return;
    }

    setManualCourseId((current) =>
      availableSessions.some((session) => session._id === current) ? current : availableSessions[0]._id
    );
  }, [availableSessions]);

  const handleManualAttendance = async (event) => {
    event.preventDefault();
    if (!manualCourseId) {
      setAttendanceError("Aucune seance ouverte n'est disponible pour une declaration manuelle.");
      return;
    }

    setSubmitting(true);
    setAttendanceError("");
    setAttendanceMessage("");

    try {
      const attendance = await resourceService.post("/attendances/student", { courseId: manualCourseId });
      setAttendanceMessage(
        `Presence enregistree avec succes pour "${attendance.course?.title || "le cours"}" le ${attendance.course?.date || ""} a ${new Date(
          attendance.scannedAt
        ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`
      );
      await loadSummary();
    } catch (requestError) {
      setAttendanceError(requestError.response?.data?.message || "Impossible de declarer la presence.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!summary) return <Loader label="Chargement de vos presences..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Historique"
        title="Mes presences"
        description="Retrouvez votre taux global, le detail par cours et chaque pointage enregistre."
        actions={
          <>
            <Link className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" to="/student/scanner">
              Scanner un QR code
            </Link>
            <SortSelect
              value={sorter}
              onChange={setSorter}
              options={[
                { value: "date-desc", label: "Plus recent" },
                { value: "date-asc", label: "Plus ancien" },
                { value: "status-asc", label: "Statut A a Z" },
                { value: "status-desc", label: "Statut Z a A" }
              ]}
            />
          </>
        }
      />

      <div className="glass-card space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
          <Keyboard className="h-4 w-4" />
          Declarer ma presence
        </div>
        <p className="text-sm text-slate-500">
          Si le QR code n'est pas disponible, vous pouvez enregistrer votre presence manuellement sur une seance actuellement ouverte.
        </p>
        <form className="grid gap-4 lg:grid-cols-[1fr_auto]" onSubmit={handleManualAttendance}>
          <select
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={manualCourseId}
            onChange={(event) => setManualCourseId(event.target.value)}
            disabled={!availableSessions.length || submitting}
          >
            <option value="">Aucune seance ouverte</option>
            {availableSessions.map((session) => (
              <option key={session._id} value={session._id}>
                {session.title} · {session.date} · {session.startTime} - {session.endTime}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!manualCourseId || submitting}
          >
            <QrCode className="h-4 w-4" />
            Declarer ma presence
          </button>
        </form>
        {attendanceMessage ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{attendanceMessage}</div> : null}
        {attendanceError ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{attendanceError}</div> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Taux global</p>
          <div className="mt-4">
            <ProgressBadge rate={summary.rate} />
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Heures presentes</p>
          <p className="mt-4 text-3xl font-bold text-slate-950">{Number(summary.presentHours || 0).toFixed(1)} h</p>
          <p className="mt-2 text-sm text-slate-500">sur {Number(summary.totalHours || 0).toFixed(1)} h prevues</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Presences enregistrees</p>
          <p className="mt-4 text-3xl font-bold text-slate-950">{summary.attendanceCount || 0}</p>
          <p className="mt-2 text-sm text-slate-500">{summary.absenceCount || 0} absence(s)</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Formations suivies</p>
          <p className="mt-4 text-3xl font-bold text-slate-950">{summary.byFormation?.length || 0}</p>
          <p className="mt-2 text-sm text-slate-500">Vision consolidee de votre assiduite</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-brand-500">Par cours</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Suivi detaille</h3>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {summary.byCourse?.length ? (
            summary.byCourse.map((course) => (
              <div key={course.courseId} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{course.courseTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{course.formationName}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{course.rate.toFixed(1)}%</span>
                </div>
                <div className="mt-4">
                  <ProgressBadge rate={course.rate} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Seances</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{course.attendanceCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Presents</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{course.presentCount + course.lateCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Heures</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{Number(course.presentHours || 0).toFixed(1)} h</p>
                  </div>
                </div>
                <Link
                  className="mt-4 inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  to={`/student/scanner?courseId=${course.courseId}`}
                >
                  Scanner le QR du cours
                </Link>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">Aucun historique de presence pour le moment.</p>
          )}
        </div>
      </div>

      <DataTable
        columns={[
          { key: "course", label: "Cours", sortable: true, sortValue: (row) => row.course?.title || "", render: (row) => row.course?.title || "-" },
          { key: "formation", label: "Formation", sortable: true, sortValue: (row) => row.formation?.name || "", render: (row) => row.formation?.name || "-" },
          { key: "date", label: "Date", sortable: true, sortValue: (row) => row.course?.date || "", render: (row) => row.course?.date || "-" },
          { key: "status", label: "Statut", sortable: true, render: (row) => <StatusPill status={row.status} /> },
          { key: "presenceHours", label: "Heures comptees", sortable: true },
          { key: "source", label: "Source", sortable: true },
          { key: "scannedAt", label: "Horodatage", sortable: true, sortValue: (row) => new Date(row.scannedAt || 0), render: (row) => new Date(row.scannedAt).toLocaleString("fr-FR") }
        ]}
        rows={sortedRows}
        defaultSort={{ key: "scannedAt", direction: "desc" }}
        emptyMessage="Aucune presence enregistree."
      />
    </div>
  );
};
