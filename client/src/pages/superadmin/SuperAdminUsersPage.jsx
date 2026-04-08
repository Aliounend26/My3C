import { useEffect, useMemo, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { StatCard } from "../../components/common/StatCard";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

const roleOptions = [
  { value: "superadmin", label: "SuperAdmin" },
  { value: "admin", label: "Admin" },
  { value: "teacher", label: "Formateur" },
  { value: "student", label: "Etudiant" }
];

const createEmptyForm = (role = "student") => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  matricule: "",
  role,
  isActive: true,
  formations: [],
  classrooms: [],
  assignedCourses: []
});

const getRoleLabel = (role) => roleOptions.find((option) => option.value === role)?.label || role;

export const SuperAdminUsersPage = ({
  lockedRole = "",
  title = "Gestion des utilisateurs",
  description = "Pilotez tous les comptes, les activations et les rattachements pedagogiques de la plateforme."
}) => {
  const [users, setUsers] = useState(null);
  const [formations, setFormations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedRole, setSelectedRole] = useState(lockedRole);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(createEmptyForm(lockedRole || "student"));

  const load = async () => {
    const [usersData, formationsData, classesData, coursesData] = await Promise.all([
      resourceService.get(`/users${selectedRole ? `?role=${selectedRole}` : ""}`),
      resourceService.get("/formations"),
      resourceService.get("/classes"),
      resourceService.get("/courses/groups")
    ]);

    setUsers(usersData);
    setFormations(formationsData);
    setClasses(classesData);
    setCourses(coursesData);
  };

  useEffect(() => {
    load();
  }, [selectedRole]);

  const summary = useMemo(() => {
    const source = users || [];
    return {
      total: source.length,
      active: source.filter((user) => user.isActive).length,
      inactive: source.filter((user) => !user.isActive).length,
      admins: source.filter((user) => user.role === "admin").length,
      teachers: source.filter((user) => user.role === "teacher").length,
      students: source.filter((user) => user.role === "student").length
    };
  }, [users]);

  const openCreate = () => {
    setEditing(null);
    setForm(createEmptyForm(lockedRole || selectedRole || "student"));
    setOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      matricule: user.matricule || "",
      role: user.role || "student",
      isActive: user.isActive ?? true,
      formations: (user.formations || []).map((formation) => formation._id || formation),
      classrooms: (user.classrooms || []).map((classroom) => classroom._id || classroom),
      assignedCourses: (user.assignedCourses || []).map((course) => course._id || course)
    });
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      matricule: form.matricule,
      role: lockedRole || form.role,
      isActive: form.isActive,
      formations: form.formations,
      classrooms: form.classrooms,
      assignedCourses: form.assignedCourses
    };

    if (!editing && form.password) {
      payload.password = form.password;
    }

    if (editing) {
      await resourceService.put(`/users/${editing._id}`, payload);
    } else {
      await resourceService.post("/users", { ...payload, password: form.password || "ChangeMe123!" });
    }

    setOpen(false);
    setEditing(null);
    setForm(createEmptyForm(lockedRole || selectedRole || "student"));
    await load();
  };

  if (!users) return <Loader label="Chargement des utilisateurs..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Centre de controle"
        title={title}
        description={description}
        actions={
          <div className="flex flex-wrap gap-3">
            {!lockedRole ? (
              <select
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
              >
                <option value="">Tous les roles</option>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : null}
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={openCreate}>
              Nouvel utilisateur
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Utilisateurs" value={summary.total} hint="Dans cette vue" accent="bg-slate-700" />
        <StatCard title="Actifs" value={summary.active} hint="Comptes operationnels" accent="bg-emerald-500" />
        <StatCard title="Inactifs" value={summary.inactive} hint="A reactiver si besoin" accent="bg-amber-500" />
        <StatCard title="Admins" value={summary.admins} hint="Pilotage operationnel" accent="bg-sky-500" />
        <StatCard title="Formateurs" value={summary.teachers} hint="Encadrement pedagogique" accent="bg-violet-500" />
        <StatCard title="Etudiants" value={summary.students} hint="Apprenants inscrits" accent="bg-blue-500" />
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
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{getRoleLabel(row.role)}</p>
                </div>
              )
            },
            { key: "email", label: "Email", sortable: true },
            {
              key: "isActive",
              label: "Etat",
              sortable: true,
              sortValue: (row) => (row.isActive ? 1 : 0),
              render: (row) => (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {row.isActive ? "Actif" : "Inactif"}
                </span>
              )
            },
            {
              key: "formations",
              label: "Formations",
              render: (row) => row.formations?.map((formation) => formation.name).join(", ") || "-"
            },
            {
              key: "classrooms",
              label: "Classes",
              render: (row) => row.classrooms?.map((classroom) => classroom.name).join(", ") || "-"
            },
            {
              key: "assignedCourses",
              label: "Cours",
              render: (row) => row.assignedCourses?.map((course) => course.title).join(", ") || "-"
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => openEdit(row)}>
                    Modifier
                  </button>
                  <button
                    className="rounded-full bg-brand-100 px-3 py-1 text-xs text-brand-700"
                    onClick={async () => {
                      await resourceService.put(`/users/${row._id}`, { isActive: !row.isActive });
                      await load();
                    }}
                  >
                    {row.isActive ? "Desactiver" : "Activer"}
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
          rows={users}
          defaultSort={{ key: "fullName", direction: "asc" }}
        />
      </div>

      <Modal
        open={open}
        title={editing ? "Modifier un utilisateur" : "Creer un utilisateur"}
        onClose={() => {
          setOpen(false);
          setEditing(null);
          setForm(createEmptyForm(lockedRole || selectedRole || "student"));
        }}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Prenom" value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nom" value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" type="email" placeholder="Email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
          {!editing ? (
            <input className="rounded-2xl border border-slate-200 px-4 py-3" type="password" placeholder="Mot de passe" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
          ) : null}
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Telephone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Matricule" value={form.matricule} onChange={(event) => setForm((current) => ({ ...current, matricule: event.target.value }))} />
          {!lockedRole ? (
            <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">{getRoleLabel(lockedRole)}</div>
          )}
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Compte actif
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Formations</span>
            <select
              className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
              multiple
              value={form.formations}
              onChange={(event) => setForm((current) => ({ ...current, formations: Array.from(event.target.selectedOptions, (option) => option.value) }))}
            >
              {formations.map((formation) => (
                <option key={formation._id} value={formation._id}>
                  {formation.name}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Classes</span>
            <select
              className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
              multiple
              value={form.classrooms}
              onChange={(event) => setForm((current) => ({ ...current, classrooms: Array.from(event.target.selectedOptions, (option) => option.value) }))}
            >
              {classes.map((classroom) => (
                <option key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>

          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Cours assignes</span>
            <select
              className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
              multiple
              value={form.assignedCourses}
              onChange={(event) => setForm((current) => ({ ...current, assignedCourses: Array.from(event.target.selectedOptions, (option) => option.value) }))}
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white md:col-span-2">
            {editing ? "Enregistrer les modifications" : "Creer le compte"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
