import { useEffect, useMemo, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

const initialForm = {
  role: "student",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  matricule: "",
  specialty: "",
  formations: [],
  classrooms: [],
  assignedCourses: [],
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

export const AdminUsersPage = () => {
  const [rows, setRows] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [formations, setFormations] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadUsers = async (role = filterRole) => {
    const users = await resourceService.get(`/users${role !== "all" ? `?role=${role}` : ""}`);
    setRows(users);
  };

  const loadSupportData = async () => {
    const [formationsData, classroomsData, coursesData] = await Promise.all([
      resourceService.get("/formations"),
      resourceService.get("/classes"),
      resourceService.get("/courses/groups")
    ]);
    setFormations(formationsData);
    setClassrooms(classroomsData);
    setCourses(coursesData);
  };

  useEffect(() => {
    loadUsers(filterRole);
  }, [filterRole]);

  useEffect(() => {
    loadSupportData();
  }, []);

  const stats = useMemo(() => {
    const source = rows || [];
    return {
      total: source.length,
      admins: source.filter((user) => user.role === "admin").length,
      teachers: source.filter((user) => user.role === "teacher").length,
      students: source.filter((user) => user.role === "student").length
    };
  }, [rows]);

  const selectedCourses = useMemo(
    () => courses.filter((course) => form.assignedCourses.includes(course._id)),
    [courses, form.assignedCourses]
  );
  const derivedTeacherFormations = useMemo(() => uniqueById(selectedCourses.map((course) => course.formation).filter(Boolean)), [selectedCourses]);
  const derivedTeacherClasses = useMemo(() => uniqueById(selectedCourses.map((course) => course.classRoom).filter(Boolean)), [selectedCourses]);

  const openCreateModal = (role) => {
    setForm({
      ...initialForm,
      role,
      password: role === "teacher" ? "Teacher123!" : "Student123!"
    });
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      role: form.role,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      isActive: form.isActive
    };

    if (form.role === "teacher") {
      payload.specialty = form.specialty;
      payload.assignedCourses = form.assignedCourses;
    } else {
      payload.matricule = form.matricule;
      payload.formations = form.formations;
      payload.classrooms = form.classrooms;
      payload.assignedCourses = form.assignedCourses;
    }

    await resourceService.post("/users", payload);
    setOpen(false);
    setForm(initialForm);
    await loadUsers();
  };

  if (!rows) return <Loader label="Chargement des utilisateurs..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Vue utilisateurs"
        description="Consultez rapidement les comptes de l'etablissement et creez ici un etudiant ou un formateur sans quitter la vue globale."
        actions={
          <>
            <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={filterRole} onChange={(event) => setFilterRole(event.target.value)}>
              <option value="all">Tous les roles</option>
              <option value="student">Etudiants</option>
              <option value="teacher">Formateurs</option>
              <option value="admin">Admins</option>
            </select>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" onClick={() => openCreateModal("student")}>
              Nouvel etudiant
            </button>
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => openCreateModal("teacher")}>
              Nouveau formateur
            </button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Utilisateurs" value={stats.total} hint="Dans cette vue" accent="bg-slate-700" />
        <StatCard title="Admins" value={stats.admins} hint="Lecture seule" accent="bg-sky-500" />
        <StatCard title="Formateurs" value={stats.teachers} hint="Gestion dediee" accent="bg-violet-500" />
        <StatCard title="Etudiants" value={stats.students} hint="Gestion dediee" accent="bg-emerald-500" />
      </div>

      <div className="glass-card p-5">
        <DataTable
          columns={[
            {
              key: "fullName",
              label: "Utilisateur",
              sortable: true,
              sortValue: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
              render: (row) => (
                <div>
                  <p className="font-semibold text-slate-900">{row.firstName} {row.lastName}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{row.role}</p>
                </div>
              )
            },
            { key: "email", label: "Email", sortable: true },
            { key: "phone", label: "Telephone", sortable: true, render: (row) => row.phone || "-" },
            { key: "formations", label: "Formations", render: (row) => row.formations?.map((formation) => formation.name).join(", ") || "-" },
            { key: "classrooms", label: "Classes", render: (row) => row.classrooms?.map((classroom) => classroom.name).join(", ") || "-" },
            { key: "assignedCourses", label: "Cours", render: (row) => row.assignedCourses?.map((course) => course.title).join(", ") || "-" }
          ]}
          rows={rows}
          defaultSort={{ key: "fullName", direction: "asc" }}
        />
      </div>

      <Modal open={open} title={form.role === "teacher" ? "Creer un formateur" : "Creer un etudiant"} onClose={() => setOpen(false)} size="lg">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Type de compte</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...initialForm,
                  role: event.target.value,
                  password: event.target.value === "teacher" ? "Teacher123!" : "Student123!"
                }))
              }
            >
              <option value="student">Etudiant</option>
              <option value="teacher">Formateur</option>
            </select>
          </label>

          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Prenom" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nom" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Telephone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="Mot de passe" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />

          {form.role === "teacher" ? (
            <>
              <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Specialite / domaine d'intervention" value={form.specialty} onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))} />

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
                  Formations: {derivedTeacherFormations.length ? derivedTeacherFormations.map((formation) => formation.name).join(", ") : "Aucune"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Classes: {derivedTeacherClasses.length ? derivedTeacherClasses.map((classRoom) => classRoom.name).join(", ") : "Aucune"}
                </p>
                <p className="mt-2 text-xs text-slate-500">Le formateur peut etre affecte a plusieurs cours, classes et formations via ces selections.</p>
              </div>
            </>
          ) : (
            <>
              <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Matricule" value={form.matricule} onChange={(event) => setForm((current) => ({ ...current, matricule: event.target.value }))} />

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
            </>
          )}

          <label className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Compte actif
          </label>

          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">Creer le compte</button>
        </form>
      </Modal>
    </div>
  );
};
