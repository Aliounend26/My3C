import { useEffect, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

const initialForm = {
  name: "",
  code: "",
  formation: "",
  teacher: "",
  students: []
};

export const AdminClassesPage = () => {
  const [rows, setRows] = useState(null);
  const [formations, setFormations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    const [classData, formationData, teacherData, studentData] = await Promise.all([
      resourceService.get("/classes"),
      resourceService.get("/formations"),
      resourceService.get("/users?role=teacher"),
      resourceService.get("/users?role=student")
    ]);

    setRows(classData);
    setFormations(formationData);
    setTeachers(teacherData);
    setStudents(studentData);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (editing) {
      await resourceService.put(`/classes/${editing._id}`, form);
    } else {
      await resourceService.post("/classes", form);
    }
    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    await load();
  };

  if (!rows) return <Loader label="Chargement des classes..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des classes"
        description="Structurez les classes de l'etablissement, associez-les aux formations et rattachez les etudiants."
        actions={<button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => { setEditing(null); setForm(initialForm); setOpen(true); }}>Nouvelle classe</button>}
      />

      <div className="glass-card p-5">
        <DataTable
          columns={[
            { key: "name", label: "Classe", sortable: true },
            { key: "code", label: "Code", sortable: true },
            { key: "formation", label: "Formation", render: (row) => row.formation?.name || "-" },
            { key: "teacher", label: "Formateur", render: (row) => row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : "-" },
            { key: "students", label: "Etudiants", render: (row) => row.students?.length || 0, sortable: true, sortValue: (row) => row.students?.length || 0 },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => { setEditing(row); setForm({ name: row.name || "", code: row.code || "", formation: row.formation?._id || "", teacher: row.teacher?._id || "", students: (row.students || []).map((student) => student._id || student) }); setOpen(true); }}>
                    Modifier
                  </button>
                  <button className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700" onClick={async () => { await resourceService.delete(`/classes/${row._id}`); await load(); }}>
                    Supprimer
                  </button>
                </div>
              )
            }
          ]}
          rows={rows}
        />
      </div>

      <Modal open={open} title={editing ? "Modifier une classe" : "Creer une classe"} onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nom de classe" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} required />
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.formation} onChange={(event) => setForm((current) => ({ ...current, formation: event.target.value }))} required>
            <option value="">Choisir une formation</option>
            {formations.map((formation) => (
              <option key={formation._id} value={formation._id}>
                {formation.name}
              </option>
            ))}
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.teacher} onChange={(event) => setForm((current) => ({ ...current, teacher: event.target.value }))}>
            <option value="">Aucun formateur</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.firstName} {teacher.lastName}
              </option>
            ))}
          </select>
          <label className="md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Etudiants rattaches</span>
            <select className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3" multiple value={form.students} onChange={(event) => setForm((current) => ({ ...current, students: Array.from(event.target.selectedOptions, (option) => option.value) }))}>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">Enregistrer</button>
        </form>
      </Modal>
    </div>
  );
};
