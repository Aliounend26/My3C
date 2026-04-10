import { useEffect, useMemo, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { LoadingButton } from "../../components/common/LoadingButton";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialty: "",
  assignedCourses: [],
  password: "Teacher123!",
  isActive: true
};

const uniqueById = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    if (item?._id && !map.has(item._id)) {
      map.set(item._id, item);
    }
  });
  return [...map.values()];
};

export const AdminTeachersPage = () => {
  const [teachers, setTeachers] = useState(null);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [detailTeacher, setDetailTeacher] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "" });

  const load = async () => {
    const [teachersData, courseData] = await Promise.all([resourceService.get("/users?role=teacher"), resourceService.get("/courses/groups")]);
    setTeachers(teachersData);
    setCourses(courseData);
  };

  useEffect(() => {
    load();
  }, []);

  const selectedCourses = useMemo(
    () => courses.filter((course) => form.assignedCourses.includes(course._id)),
    [courses, form.assignedCourses]
  );
  const derivedFormations = useMemo(() => uniqueById(selectedCourses.map((course) => course.formation).filter(Boolean)), [selectedCourses]);
  const derivedClasses = useMemo(() => uniqueById(selectedCourses.map((course) => course.classRoom).filter(Boolean)), [selectedCourses]);

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
        specialty: form.specialty,
        assignedCourses: form.assignedCourses,
        isActive: form.isActive
      };

      if (editing) {
        await resourceService.put(`/users/${editing._id}`, payload);
      } else {
        await resourceService.post("/users", { ...payload, role: "teacher", password: form.password });
      }

      setOpen(false);
      setEditing(null);
      setForm(initialForm);
      setFeedback({ error: "", success: editing ? "Formateur mis a jour." : "Compte formateur cree avec succes." });
      await load();
    } catch (requestError) {
      setFeedback({ error: requestError.response?.data?.message || "Enregistrement impossible.", success: "" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!teachers) return <Loader label="Chargement des formateurs..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des formateurs"
        description="Creez les comptes formateurs, affectez-les a plusieurs cours et laissez les formations/classes se deduire automatiquement de ces affectations."
        actions={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setEditing(null);
              setForm(initialForm);
              setOpen(true);
            }}
          >
            Nouveau formateur
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Formateurs</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{teachers.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Cours affectes</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{teachers.reduce((sum, teacher) => sum + (teacher.assignedCourses?.length || 0), 0)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Classes couvertes</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{uniqueById(teachers.flatMap((teacher) => teacher.classrooms || [])).length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Formations couvertes</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{uniqueById(teachers.flatMap((teacher) => teacher.formations || [])).length}</p>
        </div>
      </div>

      <div className="glass-card p-5">
        {feedback.error ? <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback.error}</div> : null}
        {feedback.success ? <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback.success}</div> : null}
        <DataTable
          columns={[
            {
              key: "fullName",
              label: "Formateur",
              sortable: true,
              sortValue: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
              render: (row) => (
                <div>
                  <p className="font-semibold text-slate-900">
                    {row.firstName} {row.lastName}
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.isActive ? "Actif" : "Inactif"}</p>
                </div>
              )
            },
            { key: "email", label: "Email", sortable: true },
            { key: "phone", label: "Telephone", sortable: true, render: (row) => row.phone || "-" },
            { key: "specialty", label: "Specialite", sortable: true, render: (row) => row.specialty || "-" },
            { key: "courseCount", label: "Cours", sortable: true, sortValue: (row) => row.assignedCourses?.length || 0, render: (row) => row.assignedCourses?.length || 0 },
            { key: "classCount", label: "Classes", sortable: true, sortValue: (row) => row.classrooms?.length || 0, render: (row) => row.classrooms?.length || 0 },
            { key: "formationCount", label: "Formations", sortable: true, sortValue: (row) => row.formations?.length || 0, render: (row) => row.formations?.length || 0 },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => setDetailTeacher(row)}>
                    Fiche
                  </button>
                  <button
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs"
                    onClick={() => {
                      setEditing(row);
                      setForm({
                        firstName: row.firstName || "",
                        lastName: row.lastName || "",
                        email: row.email || "",
                        phone: row.phone || "",
                        specialty: row.specialty || "",
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
                      await load();
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              )
            }
          ]}
          rows={teachers}
          defaultSort={{ key: "fullName", direction: "asc" }}
        />
      </div>

      <Modal
        open={open}
        title={editing ? "Modifier un formateur" : "Creer un formateur"}
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
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Specialite / domaine d'intervention" value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))} />
          {!editing ? (
            <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" type="password" placeholder="Mot de passe" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          ) : null}

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Cours assignes</span>
            <select
              className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
              multiple
              value={form.assignedCourses}
              onChange={(event) => setForm((current) => ({ ...current, assignedCourses: Array.from(event.target.selectedOptions, (option) => option.value) }))}
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title} - {course.formation?.name || "Formation"} - {course.classRoom?.name || "Sans classe"}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
            <p className="text-sm font-semibold text-slate-900">Affectations deduites</p>
            <p className="mt-3 text-sm text-slate-600">
              Formations: {derivedFormations.length ? derivedFormations.map((formation) => formation.name).join(", ") : "Aucune"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Classes: {derivedClasses.length ? derivedClasses.map((classRoom) => classRoom.name).join(", ") : "Aucune"}
            </p>
            <p className="mt-2 text-xs text-slate-500">Les formations et classes du formateur sont calculees automatiquement depuis les cours selectionnes.</p>
          </div>

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

      <Modal open={Boolean(detailTeacher)} title="Fiche formateur" onClose={() => setDetailTeacher(null)}>
        {detailTeacher ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                {detailTeacher.firstName} {detailTeacher.lastName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{detailTeacher.email}</p>
              <p className="mt-2 text-sm text-slate-600">{detailTeacher.specialty || "Specialite non renseignee"}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Cours</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{detailTeacher.assignedCourses?.length || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Classes</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{detailTeacher.classrooms?.length || 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Formations</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{detailTeacher.formations?.length || 0}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Cours assignes</p>
              <div className="mt-3 space-y-2">
                {detailTeacher.assignedCourses?.length ? (
                  detailTeacher.assignedCourses.map((course) => (
                    <div key={course._id} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="font-semibold text-slate-900">{course.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {course.formation?.name || "-"} · {course.classRoom?.name || "Sans classe"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Aucun cours affecte.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Formations concernees</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detailTeacher.formations?.length ? (
                  detailTeacher.formations.map((formation) => (
                    <span key={formation._id} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                      {formation.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Aucune formation</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Classes concernees</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detailTeacher.classrooms?.length ? (
                  detailTeacher.classrooms.map((classRoom) => (
                    <span key={classRoom._id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {classRoom.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Aucune classe</span>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
