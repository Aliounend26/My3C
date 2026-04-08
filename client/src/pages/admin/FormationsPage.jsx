import { useEffect, useMemo, useState } from "react";
import { DataTable } from "../../components/tables/DataTable";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { Loader } from "../../components/common/Loader";
import { SortSelect } from "../../components/common/SortSelect";
import { resourceService } from "../../services/resourceService";
import { sortRows } from "../../utils/sorting";

const initialForm = { name: "", code: "", totalHours: 120, description: "" };

export const FormationsPage = () => {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedFormation, setSelectedFormation] = useState(null);
  const [formationStudents, setFormationStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sorter, setSorter] = useState("title-asc");

  const sortedRows = useMemo(() => sortRows(rows, sorter), [rows, sorter]);

  const loadData = async () => {
    setLoading(true);
    setRows(await resourceService.get("/formations"));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (editing) await resourceService.put(`/formations/${editing._id}`, form);
    else await resourceService.post("/formations", form);
    setOpen(false);
    setEditing(null);
    setForm(initialForm);
    loadData();
  };

  const openStudentsModal = async (formation) => {
    setSelectedFormation(formation);
    setFormationStudents(await resourceService.get(`/students?formation=${formation._id}`));
  };

  const removeStudentFromFormation = async (student) => {
    if (!selectedFormation) return;

    const updatedFormations = (student.formations || [])
      .map((formation) => (typeof formation === "string" ? formation : formation._id))
      .filter((formationId) => formationId !== selectedFormation._id);

    await resourceService.put(`/students/${student._id}`, {
      formations: updatedFormations
    });

    setFormationStudents((current) => current.filter((item) => item._id !== student._id));
  };

  if (loading) return <Loader label="Chargement des formations..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des formations"
        description="Créez et pilotez les formations avec le volume horaire total attendu."
        actions={
          <>
            <SortSelect
              value={sorter}
              onChange={setSorter}
              options={[
                { value: "title-asc", label: "A à Z" },
                { value: "title-desc", label: "Z à A" },
                { value: "hours-asc", label: "Heures croissantes" },
                { value: "hours-desc", label: "Heures décroissantes" }
              ]}
            />
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => setOpen(true)}>
              Nouvelle formation
            </button>
          </>
        }
      />

      <DataTable
        columns={[
          {
            key: "name",
            label: "Formation",
            sortable: true,
            render: (row) => (
              <button className="font-semibold text-brand-700 hover:underline" onClick={() => openStudentsModal(row)}>
                {row.name}
              </button>
            )
          },
          { key: "code", label: "Code", sortable: true },
          { key: "totalHours", label: "Heures totales", sortable: true },
          { key: "description", label: "Description" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <button className="rounded-full bg-slate-100 px-3 py-1" onClick={() => { setEditing(row); setForm({ name: row.name, code: row.code, totalHours: row.totalHours, description: row.description }); setOpen(true); }}>
                  Modifier
                </button>
                <button className="rounded-full bg-rose-100 px-3 py-1 text-rose-700" onClick={async () => { await resourceService.delete(`/formations/${row._id}`); loadData(); }}>
                  Supprimer
                </button>
              </div>
            )
          }
        ]}
        rows={sortedRows}
        defaultSort={{ key: "name", direction: "asc" }}
      />

      <Modal open={open} title={editing ? "Modifier la formation" : "Nouvelle formation"} onClose={() => setOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nom" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Code" value={form.code} onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))} required />
          <div className="md:col-span-2">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              type="number"
              min="1"
              placeholder="Nombre total d'heures (ex: 120)"
              value={form.totalHours}
              onChange={(e) => setForm((c) => ({ ...c, totalHours: Number(e.target.value) }))}
              required
            />
            <p className="mt-2 px-1 text-xs text-slate-500">Ce champ correspond au nombre total d'heures prevu pour la formation.</p>
          </div>
          <textarea className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} />
          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">Enregistrer</button>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedFormation)}
        title={selectedFormation ? `Étudiants inscrits - ${selectedFormation.name}` : "Étudiants inscrits"}
        onClose={() => {
          setSelectedFormation(null);
          setFormationStudents([]);
        }}
      >
        <DataTable
          columns={[
            { key: "firstName", label: "Prénom", sortable: true },
            { key: "lastName", label: "Nom", sortable: true },
            { key: "email", label: "Email", sortable: true },
            { key: "matricule", label: "Matricule", sortable: true },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <button className="rounded-full bg-rose-100 px-3 py-1 text-sm text-rose-700" onClick={() => removeStudentFromFormation(row)}>
                  Retirer
                </button>
              )
            }
          ]}
          rows={formationStudents}
          defaultSort={{ key: "firstName", direction: "asc" }}
        />
      </Modal>
    </div>
  );
};
