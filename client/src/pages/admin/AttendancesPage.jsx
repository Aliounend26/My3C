import { useEffect, useMemo, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { SortSelect } from "../../components/common/SortSelect";
import { StatusPill } from "../../components/common/StatusPill";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";
import { sortRows } from "../../utils/sorting";

const initialForm = { studentId: "", courseId: "", status: "present" };
const initialFilters = { student: "", formation: "", course: "", status: "", date: "" };

export const AttendancesPage = () => {
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formations, setFormations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [sorter, setSorter] = useState("date-desc");

  const sortedRows = useMemo(() => sortRows(rows, sorter), [rows, sorter]);

  const buildQueryString = (query) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const loadData = async () => {
    setLoading(true);
    const [attendanceData, studentsData, coursesData, formationsData] = await Promise.all([
      resourceService.get(`/attendances${buildQueryString(filters)}`),
      resourceService.get("/students"),
      resourceService.get("/courses"),
      resourceService.get("/formations")
    ]);

    setRows(attendanceData);
    setStudents(studentsData);
    setCourses(coursesData);
    setFormations(formationsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const submit = async (event) => {
    event.preventDefault();

    if (editing) {
      await resourceService.put(`/attendances/${editing._id}`, {
        status: form.status
      });
    } else {
      await resourceService.post("/attendances/manual", form);
    }

    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    loadData();
  };

  const downloadExcel = async () => {
    await resourceService.download(`/attendances/export${buildQueryString(filters)}`, "presences.xlsx");
  };

  if (loading) return <Loader label="Chargement des présences..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des présences"
        description="Consultez l'historique, corrigez les statuts, saisissez des présences manuellement et exportez un fichier Excel par formation, cours ou étudiant."
        actions={
          <>
            <button className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white" onClick={downloadExcel}>
              Télécharger Excel
            </button>
            <SortSelect
              value={sorter}
              onChange={setSorter}
              options={[
                { value: "date-desc", label: "Plus récent" },
                { value: "date-asc", label: "Plus ancien" },
                { value: "name-asc", label: "Étudiant A à Z" },
                { value: "name-desc", label: "Étudiant Z à A" },
                { value: "status-asc", label: "Statut A à Z" },
                { value: "status-desc", label: "Statut Z à A" }
              ]}
            />
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => setOpen(true)}>
              Ajouter une présence
            </button>
          </>
        }
      />

      <div className="glass-card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.formation} onChange={(e) => setFilters((current) => ({ ...current, formation: e.target.value }))}>
          <option value="">Toutes les formations</option>
          {formations.map((formation) => (
            <option key={formation._id} value={formation._id}>
              {formation.name}
            </option>
          ))}
        </select>

        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.course} onChange={(e) => setFilters((current) => ({ ...current, course: e.target.value }))}>
          <option value="">Tous les cours</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title} - {course.date}
            </option>
          ))}
        </select>

        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.student} onChange={(e) => setFilters((current) => ({ ...current, student: e.target.value }))}>
          <option value="">Tous les étudiants</option>
          {students.map((student) => (
            <option key={student._id} value={student._id}>
              {student.firstName} {student.lastName}
            </option>
          ))}
        </select>

        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
          <option value="">Tous les statuts</option>
          <option value="present">Présent</option>
          <option value="late">Retard</option>
          <option value="absent">Absent</option>
        </select>

        <input className="rounded-2xl border border-slate-200 px-4 py-3" type="date" value={filters.date} onChange={(e) => setFilters((current) => ({ ...current, date: e.target.value }))} />
      </div>

      <DataTable
        columns={[
          {
            key: "student",
            label: "Étudiant",
            sortable: true,
            sortValue: (row) => `${row.student?.firstName || ""} ${row.student?.lastName || ""}`.trim(),
            render: (row) => `${row.student?.firstName || ""} ${row.student?.lastName || ""}`.trim()
          },
          { key: "course", label: "Cours", sortable: true, sortValue: (row) => row.course?.title || "", render: (row) => row.course?.title || "-" },
          { key: "formation", label: "Formation", sortable: true, sortValue: (row) => row.formation?.name || "", render: (row) => row.formation?.name || "-" },
          { key: "status", label: "Statut", sortable: true, render: (row) => <StatusPill status={row.status} /> },
          { key: "presenceHours", label: "Heures comptées", sortable: true },
          { key: "source", label: "Source", sortable: true },
          { key: "scannedAt", label: "Horodatage", sortable: true, sortValue: (row) => new Date(row.scannedAt), render: (row) => new Date(row.scannedAt).toLocaleString("fr-FR") },
          {
            key: "actions",
            label: "Correction",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-700"
                  onClick={() => {
                    setEditing(row);
                    setForm({
                      studentId: row.student?._id || "",
                      courseId: row.course?._id || "",
                      status: row.status
                    });
                    setOpen(true);
                  }}
                >
                  Modifier
                </button>
                {["present", "late", "absent"].map((status) => (
                  <button
                    key={status}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize"
                    onClick={async () => {
                      await resourceService.put(`/attendances/${row._id}`, { status });
                      loadData();
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )
          }
        ]}
        rows={sortedRows}
        defaultSort={{ key: "scannedAt", direction: "desc" }}
      />

      <Modal
        open={open}
        title={editing ? "Modifier une présence" : "Enregistrer une présence"}
        onClose={() => {
          setOpen(false);
          setEditing(null);
          setForm(initialForm);
        }}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.studentId} onChange={(e) => setForm((current) => ({ ...current, studentId: e.target.value }))} required disabled={Boolean(editing)}>
            <option value="">Choisir un étudiant</option>
            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>

          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.courseId} onChange={(e) => setForm((current) => ({ ...current, courseId: e.target.value }))} required disabled={Boolean(editing)}>
            <option value="">Choisir un cours</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title} - {course.date}
              </option>
            ))}
          </select>

          <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))}>
            <option value="present">Présent</option>
            <option value="late">Retard</option>
            <option value="absent">Absent</option>
          </select>

          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
            {editing ? "Mettre à jour" : "Enregistrer"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
