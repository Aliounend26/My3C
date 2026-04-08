import { useEffect, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";

const initialForm = {
  title: "",
  description: "",
  course: "",
  order: 1
};

export const AdminSectionsPage = () => {
  const [rows, setRows] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [courseData, sectionData] = await Promise.all([
      resourceService.get("/courses/groups"),
      resourceService.get(`/sections${selectedCourse ? `?course=${selectedCourse}` : ""}`)
    ]);
    setCourses(courseData);
    setRows(sectionData);
  };

  useEffect(() => {
    load();
  }, [selectedCourse]);

  const submit = async (event) => {
    event.preventDefault();
    if (editing) {
      await resourceService.put(`/sections/${editing._id}`, form);
    } else {
      await resourceService.post("/sections", form);
    }
    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    await load();
  };

  if (!rows) return <Loader label="Chargement des sections..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des sections"
        description="Organisez chaque cours en sections claires pour structurer le parcours pedagogique."
        actions={
          <div className="flex flex-wrap gap-3">
            <select className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" value={selectedCourse} onChange={(event) => setSelectedCourse(event.target.value)}>
              <option value="">Tous les cours</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => { setEditing(null); setForm({ ...initialForm, course: selectedCourse || "" }); setOpen(true); }}>
              Nouvelle section
            </button>
          </div>
        }
      />

      <div className="glass-card p-5">
        <DataTable
          columns={[
            { key: "title", label: "Section", sortable: true },
            { key: "course", label: "Cours", render: (row) => row.course?.title || "-" },
            { key: "order", label: "Ordre", sortable: true },
            { key: "description", label: "Description", render: (row) => row.description || "-" },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <button className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => { setEditing(row); setForm({ title: row.title || "", description: row.description || "", course: row.course?._id || row.course || "", order: row.order || 1 }); setOpen(true); }}>
                    Modifier
                  </button>
                  <button className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700" onClick={async () => { await resourceService.delete(`/sections/${row._id}`); await load(); }}>
                    Supprimer
                  </button>
                </div>
              )
            }
          ]}
          rows={rows}
        />
      </div>

      <Modal open={open} title={editing ? "Modifier une section" : "Creer une section"} onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Titre" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={form.course} onChange={(event) => setForm((current) => ({ ...current, course: event.target.value }))} required>
            <option value="">Choisir un cours</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="number" min="1" placeholder="Ordre" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) }))} required />
          <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">Enregistrer</button>
        </form>
      </Modal>
    </div>
  );
};
