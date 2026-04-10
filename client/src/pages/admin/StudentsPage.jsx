import { useEffect, useMemo, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { LoadingButton } from "../../components/common/LoadingButton";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { SortSelect } from "../../components/common/SortSelect";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";
import { sortRows } from "../../utils/sorting";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  matricule: "",
  formations: [],
  classrooms: [],
  assignedCourses: [],
  password: "Student123!",
  isActive: true
};

const initialFilters = {
  formation: "",
  course: "",
  student: "",
  status: ""
};

export const StudentsPage = () => {
  const [rows, setRows] = useState([]);
  const [formations, setFormations] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [sorter, setSorter] = useState("name-asc");
  const [filters, setFilters] = useState(initialFilters);

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchesFormation = !filters.formation || row.formations?.some((formation) => formation._id === filters.formation);
        const matchesCourse = !filters.course || row.assignedCourses?.some((course) => course._id === filters.course);
        const matchesStudent = !filters.student || row._id === filters.student;
        const matchesStatus =
          !filters.status ||
          (filters.status === "active" && row.isActive) ||
          (filters.status === "inactive" && !row.isActive);

        return matchesFormation && matchesCourse && matchesStudent && matchesStatus;
      }),
    [filters, rows]
  );

  const sortedRows = useMemo(() => sortRows(filteredRows, sorter), [filteredRows, sorter]);

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
    const [studentsData, formationsData, classesData, courseData] = await Promise.all([
      resourceService.get("/users?role=student"),
      resourceService.get("/formations"),
      resourceService.get("/classes"),
      resourceService.get("/courses/groups")
    ]);
    setRows(studentsData);
    setFormations(formationsData);
    setClassrooms(classesData);
    setCourses(courseData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const downloadExcel = async () => {
    await resourceService.download(`/students/export${buildQueryString(filters)}`, "etudiants.xlsx");
  };

  const submit = async (event) => {
    event.preventDefault();
    setFeedback({ error: "", success: "" });
    setSubmitting(true);

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        matricule: form.matricule,
        formations: form.formations,
        classrooms: form.classrooms,
        assignedCourses: form.assignedCourses,
        isActive: form.isActive
      };

      if (editing) {
        await resourceService.put(`/users/${editing._id}`, payload);
      } else {
        await resourceService.post("/users", { ...payload, role: "student", password: form.password });
      }

      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      setFeedback({ error: "", success: editing ? "Etudiant mis a jour." : "Compte etudiant cree avec succes." });
      await loadData();
    } catch (requestError) {
      setFeedback({ error: requestError.response?.data?.message || "Enregistrement impossible.", success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader label="Chargement des etudiants..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des etudiants"
        description="Creez les comptes etudiants, rattachez-les aux formations, classes et cours, puis suivez leur organisation pedagogique."
        actions={
          <>
            <button className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white" onClick={downloadExcel}>
              Telecharger Excel
            </button>
            <SortSelect
              value={sorter}
              onChange={setSorter}
              options={[
                { value: "name-asc", label: "A a Z" },
                { value: "name-desc", label: "Z a A" },
                { value: "created-desc", label: "Plus recent" },
                { value: "created-asc", label: "Plus ancien" }
              ]}
            />
            <button
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              onClick={() => {
                setEditing(null);
                setForm(initialForm);
                setOpen(true);
              }}
            >
              Nouvel etudiant
            </button>
          </>
        }
      />

      <div className="glass-card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.formation} onChange={(event) => setFilters((current) => ({ ...current, formation: event.target.value, student: "" }))}>
          <option value="">Toutes les formations</option>
          {formations.map((formation) => (
            <option key={formation._id} value={formation._id}>
              {formation.name}
            </option>
          ))}
        </select>

        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.course} onChange={(event) => setFilters((current) => ({ ...current, course: event.target.value, student: "" }))}>
          <option value="">Tous les cours</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>

        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.student} onChange={(event) => setFilters((current) => ({ ...current, student: event.target.value }))}>
          <option value="">Tous les etudiants</option>
          {filteredRows.map((student) => (
            <option key={student._id} value={student._id}>
              {student.firstName} {student.lastName}
            </option>
          ))}
        </select>

        <select className="rounded-2xl border border-slate-200 px-4 py-3" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>
      </div>

      <DataTable
        columns={[
          {
            key: "fullName",
            label: "Etudiant",
            sortable: true,
            sortValue: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
            render: (row) => (
              <div>
                <p className="font-semibold text-slate-900">{row.firstName} {row.lastName}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.matricule || "Sans matricule"}</p>
              </div>
            )
          },
          { key: "email", label: "Email", sortable: true },
          { key: "phone", label: "Telephone", sortable: true, render: (row) => row.phone || "-" },
          { key: "formations", label: "Formations", render: (row) => row.formations?.map((formation) => formation.name).join(", ") || "-" },
          { key: "classrooms", label: "Classes", render: (row) => row.classrooms?.map((classroom) => classroom.name).join(", ") || "-" },
          { key: "assignedCourses", label: "Cours", render: (row) => row.assignedCourses?.map((course) => course.title).join(", ") || "-" },
          {
            key: "isActive",
            label: "Etat",
            render: (row) => (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                {row.isActive ? "Actif" : "Inactif"}
              </span>
            )
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                  onClick={() => {
                    setEditing(row);
                    setForm({
                      firstName: row.firstName || "",
                      lastName: row.lastName || "",
                      email: row.email || "",
                      phone: row.phone || "",
                      matricule: row.matricule || "",
                      formations: row.formations?.map((formation) => formation._id) || [],
                      classrooms: row.classrooms?.map((classroom) => classroom._id) || [],
                      assignedCourses: row.assignedCourses?.map((course) => course._id) || [],
                      password: "",
                      isActive: row.isActive ?? true
                    });
                    setOpen(true);
                  }}
                >
                  Modifier
                </button>
                <button
                  className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700"
                  onClick={async () => {
                    await resourceService.delete(`/users/${row._id}`);
                    await loadData();
                  }}
                >
                  Supprimer
                </button>
              </div>
            )
          }
        ]}
        rows={sortedRows}
        defaultSort={{ key: "fullName", direction: "asc" }}
      />

      {feedback.error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback.error}</div> : null}
      {feedback.success ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback.success}</div> : null}

      <Modal
        open={open}
        title={editing ? "Modifier un etudiant" : "Creer un etudiant"}
        onClose={() => {
          setOpen(false);
          setSubmitting(false);
          setFeedback({ error: "", success: "" });
        }}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Prenom" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nom" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Telephone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Matricule" value={form.matricule} onChange={(event) => setForm((current) => ({ ...current, matricule: event.target.value }))} />

          {!editing ? (
            <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" type="password" placeholder="Mot de passe" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          ) : null}

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Formations</span>
            <select className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" multiple value={form.formations} onChange={(event) => setForm((current) => ({ ...current, formations: Array.from(event.target.selectedOptions, (option) => option.value) }))}>
              {formations.map((formation) => (
                <option key={formation._id} value={formation._id}>
                  {formation.name}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Classes</span>
            <select className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" multiple value={form.classrooms} onChange={(event) => setForm((current) => ({ ...current, classrooms: Array.from(event.target.selectedOptions, (option) => option.value) }))}>
              {classrooms.map((classroom) => (
                <option key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Cours assignes</span>
            <select className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" multiple value={form.assignedCourses} onChange={(event) => setForm((current) => ({ ...current, assignedCourses: Array.from(event.target.selectedOptions, (option) => option.value) }))}>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Compte actif
          </label>

          {feedback.error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">{feedback.error}</div> : null}

          <LoadingButton type="submit" loading={submitting} loadingText="Enregistrement..." className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
            Enregistrer
          </LoadingButton>
        </form>
      </Modal>
    </div>
  );
};
