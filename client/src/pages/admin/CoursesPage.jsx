import { useEffect, useMemo, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { SortSelect } from "../../components/common/SortSelect";
import { DataTable } from "../../components/tables/DataTable";
import { resourceService } from "../../services/resourceService";
import { courseTypeOptions, getCourseTypeLabel } from "../../utils/courseType";
import { sortRows } from "../../utils/sorting";

const initialCourseForm = {
  title: "",
  description: "",
  sessionMode: "single",
  courseType: "presentiel",
  teacher: "",
  formation: ""
};

const initialSessionForm = {
  title: "",
  description: "",
  date: "",
  startTime: "09:00",
  endTime: "12:00",
  durationHours: 3,
  courseType: "presentiel",
  instructor: "",
  formation: ""
};

const weekdayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const buildRows = (groups) =>
  groups.map((group) => {
    const sessions = [...(group.sessions || [])].sort((left, right) => {
      const dateCompare = left.date.localeCompare(right.date);
      return dateCompare !== 0 ? dateCompare : left.startTime.localeCompare(right.startTime);
    });

    const uniqueWeekdays = Array.from(
      new Set(
        sessions.map((session) => {
          const sessionDate = new Date(`${session.date}T00:00:00`);
          return weekdayLabels[sessionDate.getDay()];
        })
      )
    );

    return {
      ...group,
      sessionCount: sessions.length,
      sessions,
      firstDate: sessions[0]?.date || "",
      lastDate: sessions[sessions.length - 1]?.date || "",
      scheduleLabel: sessions.length
        ? `${uniqueWeekdays.join(", ")} · ${sessions[0]?.startTime || "-"}-${sessions[0]?.endTime || "-"}`
        : "Aucune seance programmee",
      recurringLabel: group.sessionMode === "multiple" ? `${sessions.length} seances` : sessions.length ? "Seance unique" : "Aucune seance"
    };
  });

export const CoursesPage = () => {
  const [groups, setGroups] = useState([]);
  const [formations, setFormations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courseForm, setCourseForm] = useState(initialCourseForm);
  const [sessionForm, setSessionForm] = useState(initialSessionForm);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sorter, setSorter] = useState("date-desc");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const rows = useMemo(() => buildRows(groups), [groups]);
  const sortedRows = useMemo(() => sortRows(rows, sorter), [rows, sorter]);

  const loadData = async () => {
    setLoading(true);
    const [groupsData, formationsData, teachersData, studentsData] = await Promise.all([
      resourceService.get("/courses/groups"),
      resourceService.get("/formations"),
      resourceService.get("/users?role=teacher"),
      resourceService.get("/users?role=student")
    ]);
    setGroups(groupsData);
    setFormations(formationsData);
    setTeachers(teachersData);
    setStudents(studentsData);
    setLoading(false);
    return groupsData;
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCourseDetail = async (group) => {
    const detail = await resourceService.get(`/courses/groups/${group._id}`);
    setSelectedGroup(detail);
    setSelectedStudentIds((detail.students || []).map((student) => student._id));
  };

  const openCreateCourse = () => {
    setEditingCourse(null);
    setCourseForm(initialCourseForm);
    setCourseModalOpen(true);
  };

  const openEditCourse = (group) => {
    setEditingCourse(group);
    setCourseForm({
      title: group.title || "",
      description: group.description || "",
      sessionMode: group.sessionMode || "single",
      courseType: group.courseType || "presentiel",
      teacher: group.teacher?._id || "",
      formation: group.formation?._id || ""
    });
    setCourseModalOpen(true);
  };

  const openCreateSession = (group) => {
    setEditingSession(null);
    setSelectedGroup(group);
    setSessionForm({
      ...initialSessionForm,
      title: group.title,
      description: group.description || "",
      courseType: group.courseType,
      instructor: group.instructor || "",
      formation: group.formation?._id || ""
    });
    setSessionModalOpen(true);
  };

  const openEditSession = (group, session) => {
    setSelectedGroup(group);
    setEditingSession(session);
    setSessionForm({
      ...initialSessionForm,
      ...session,
      courseType: session.courseType || group.courseType,
      instructor: session.instructor || group.instructor || "",
      formation: session.formation?._id || group.formation?._id || ""
    });
    setSessionModalOpen(true);
  };

  const submitCourse = async (event) => {
    event.preventDefault();
    const selectedTeacher = teachers.find((teacher) => teacher._id === courseForm.teacher);
    const payload = {
      ...courseForm,
      instructor: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : ""
    };

    if (editingCourse) {
      await resourceService.put(`/courses/groups/${editingCourse._id}`, payload);
      setCourseModalOpen(false);
      setEditingCourse(null);
      setCourseForm(initialCourseForm);
      const groupsData = await loadData();
      const nextGroup = groupsData.find((group) => group._id === editingCourse._id);
      if (nextGroup) {
        await openCourseDetail(nextGroup);
      }
      return;
    }

    const createdGroup = await resourceService.post("/courses/groups", payload);
    setCourseModalOpen(false);
    setCourseForm(initialCourseForm);
    const groupsData = await loadData();
    const nextGroup = groupsData.find((group) => group._id === createdGroup._id);
    if (nextGroup) {
      await openCourseDetail(nextGroup);
    }
  };

  const submitSession = async (event) => {
    event.preventDefault();

    if (editingSession) {
      await resourceService.put(`/courses/${editingSession._id}`, sessionForm);
    } else if (selectedGroup?._id) {
      await resourceService.post(`/courses/groups/${selectedGroup._id}/sessions`, sessionForm);
    }

    setSessionModalOpen(false);
    setEditingSession(null);
    setSessionForm(initialSessionForm);
    const groupsData = await loadData();
    setSelectedGroup(groupsData.find((group) => group._id === selectedGroup?._id) || null);
  };

  const deleteGroup = async (group) => {
    await Promise.all((group.sessions || []).map((session) => resourceService.delete(`/courses/${session._id}`)));
    if (selectedGroup?._id === group._id) {
      setSelectedGroup(null);
      setSelectedStudentIds([]);
    }
    await loadData();
  };

  const deleteSession = async (group, session) => {
    await resourceService.delete(`/courses/${session._id}`);
    const groupsData = await loadData();
    const nextGroup = groupsData.find((currentGroup) => currentGroup._id === group._id);
    if (nextGroup) {
      await openCourseDetail(nextGroup);
    }
  };

  const syncGroupStudents = async (groupId, studentIds) => {
    const enrolledStudents = await resourceService.put(`/courses/groups/${groupId}/students`, { studentIds });
    setSelectedStudentIds(studentIds);
    setSelectedGroup((current) => (current ? { ...current, students: enrolledStudents } : current));
    await loadData();
  };

  if (loading) return <Loader label="Chargement des cours..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Gestion des cours"
        description="Créez d'abord un cours sans date ni heure, puis ajoutez ensuite les séances en entrant dans le cours."
        actions={
          <>
            <SortSelect
              value={sorter}
              onChange={setSorter}
              options={[
                { value: "date-desc", label: "Periode recente" },
                { value: "date-asc", label: "Periode ancienne" },
                { value: "title-asc", label: "Titre A a Z" },
                { value: "title-desc", label: "Titre Z a A" }
              ]}
            />
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={openCreateCourse}>
              Nouveau cours
            </button>
          </>
        }
      />

      <DataTable
        columns={[
          { key: "title", label: "Cours", sortable: true },
          { key: "formation", label: "Formation", sortable: true, sortValue: (row) => row.formation?.name || "", render: (row) => row.formation?.name || "-" },
          { key: "teacher", label: "Formateur", sortable: true, sortValue: (row) => `${row.teacher?.firstName || ""} ${row.teacher?.lastName || ""}`.trim(), render: (row) => row.teacher ? `${row.teacher.firstName} ${row.teacher.lastName}` : "-" },
          { key: "courseType", label: "Type", sortable: true, sortValue: (row) => getCourseTypeLabel(row), render: (row) => getCourseTypeLabel(row) },
          { key: "sessionMode", label: "Mode", sortable: true, render: (row) => row.sessionMode === "multiple" ? "Seances multiples" : "Seance unique" },
          { key: "sessionCount", label: "Seances", sortable: true, render: (row) => row.recurringLabel },
          { key: "firstDate", label: "Periode", sortable: true, render: (row) => row.firstDate ? (row.firstDate === row.lastDate ? row.firstDate : `${row.firstDate} -> ${row.lastDate}`) : "Aucune seance" },
          {
            key: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full bg-slate-100 px-3 py-1" onClick={() => openCourseDetail(row)}>
                  Entrer dans le cours
                </button>
                <button className="rounded-full bg-brand-100 px-3 py-1 text-brand-700" onClick={() => openEditCourse(row)}>
                  Modifier
                </button>
                <button className="rounded-full bg-rose-100 px-3 py-1 text-rose-700" onClick={() => deleteGroup(row)}>
                  Supprimer
                </button>
              </div>
            )
          }
        ]}
        rows={sortedRows}
        defaultSort={{ key: "firstDate", direction: "desc" }}
      />

      <Modal open={courseModalOpen} title={editingCourse ? "Modifier le cours" : "Creer un cours"} onClose={() => setCourseModalOpen(false)}>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitCourse}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Nom du cours" value={courseForm.title} onChange={(e) => setCourseForm((current) => ({ ...current, title: e.target.value }))} required />
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={courseForm.sessionMode} onChange={(e) => setCourseForm((current) => ({ ...current, sessionMode: e.target.value }))} required>
            <option value="single">Seance unique</option>
            <option value="multiple">Seances multiples</option>
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={courseForm.teacher} onChange={(e) => setCourseForm((current) => ({ ...current, teacher: e.target.value }))} required>
            <option value="">Choisir un formateur</option>
            {teachers.map((teacher) => (
              <option key={teacher._id} value={teacher._id}>
                {teacher.firstName} {teacher.lastName} {teacher.specialty ? `- ${teacher.specialty}` : ""}
              </option>
            ))}
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={courseForm.courseType} onChange={(e) => setCourseForm((current) => ({ ...current, courseType: e.target.value }))} required>
            {courseTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={courseForm.formation} onChange={(e) => setCourseForm((current) => ({ ...current, formation: e.target.value }))} required>
            <option value="">Choisir une formation</option>
            {formations.map((formation) => <option key={formation._id} value={formation._id}>{formation.name}</option>)}
          </select>
          <textarea className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Description du cours" value={courseForm.description} onChange={(e) => setCourseForm((current) => ({ ...current, description: e.target.value }))} />
          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">{editingCourse ? "Mettre a jour le cours" : "Creer le cours"}</button>
        </form>
      </Modal>

      <Modal
        open={sessionModalOpen}
        title={editingSession ? "Modifier la seance" : "Ajouter une seance au cours"}
        onClose={() => {
          setSessionModalOpen(false);
          setEditingSession(null);
          setSessionForm(initialSessionForm);
        }}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submitSession}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Titre de la seance" value={sessionForm.title} onChange={(e) => setSessionForm((current) => ({ ...current, title: e.target.value }))} required />
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={sessionForm.courseType} onChange={(e) => setSessionForm((current) => ({ ...current, courseType: e.target.value }))} required>
            {courseTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Formateur" value={sessionForm.instructor} onChange={(e) => setSessionForm((current) => ({ ...current, instructor: e.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="date" value={sessionForm.date} onChange={(e) => setSessionForm((current) => ({ ...current, date: e.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm((current) => ({ ...current, startTime: e.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="time" value={sessionForm.endTime} onChange={(e) => setSessionForm((current) => ({ ...current, endTime: e.target.value }))} required />
          <div className="md:col-span-2">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              type="number"
              step="0.5"
              placeholder="Duree en heures (ex: 3)"
              value={sessionForm.durationHours}
              onChange={(e) => setSessionForm((current) => ({ ...current, durationHours: Number(e.target.value) }))}
              required
            />
            <p className="mt-2 px-1 text-xs text-slate-500">Ce champ correspond a la duree totale de la seance, en heures.</p>
          </div>
          <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={sessionForm.formation} onChange={(e) => setSessionForm((current) => ({ ...current, formation: e.target.value }))} required>
            <option value="">Choisir une formation</option>
            {formations.map((formation) => <option key={formation._id} value={formation._id}>{formation.name}</option>)}
          </select>
          <textarea className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Description de la seance" value={sessionForm.description} onChange={(e) => setSessionForm((current) => ({ ...current, description: e.target.value }))} />
          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">Enregistrer la seance</button>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedGroup) && !sessionModalOpen}
        title={selectedGroup ? `Cours - ${selectedGroup.title}` : "Cours"}
        onClose={() => {
          setSelectedGroup(null);
          setSelectedStudentIds([]);
        }}
      >
        {selectedGroup ? (
          <div className="space-y-4">
            <div className="rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-900">Formation:</span> {selectedGroup.formation?.name || "-"}</p>
              <p><span className="font-semibold text-slate-900">Formateur:</span> {selectedGroup.teacher ? `${selectedGroup.teacher.firstName} ${selectedGroup.teacher.lastName}` : "-"}</p>
              <p><span className="font-semibold text-slate-900">Type:</span> {getCourseTypeLabel(selectedGroup)}</p>
              <p><span className="font-semibold text-slate-900">Mode:</span> {selectedGroup.sessionMode === "multiple" ? "Seances multiples" : "Seance unique"}</p>
              <p><span className="font-semibold text-slate-900">Intervenant affiche:</span> {selectedGroup.instructor || "-"}</p>
              <p><span className="font-semibold text-slate-900">Description:</span> {selectedGroup.description || "-"}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white" onClick={() => openCreateSession(selectedGroup)}>
                Ajouter une seance a ce cours
              </button>
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" onClick={() => openEditCourse(selectedGroup)}>
                Modifier le cours
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Etudiants inscrits</p>
                  <p className="mt-1 text-sm text-slate-600">Ajoutez ou retirez les etudiants directement depuis cette fiche de cours.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {(selectedGroup.students || []).length} etudiant(s)
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                <select
                  className="min-h-40 w-full rounded-2xl border border-slate-200 px-4 py-3"
                  multiple
                  value={selectedStudentIds.length ? selectedStudentIds : (selectedGroup.students || []).map((student) => student._id)}
                  onChange={(event) => setSelectedStudentIds(Array.from(event.target.selectedOptions, (option) => option.value))}
                >
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName} - {student.email}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                  onClick={() => syncGroupStudents(selectedGroup._id, selectedStudentIds.length ? selectedStudentIds : (selectedGroup.students || []).map((student) => student._id))}
                  type="button"
                >
                  Enregistrer les inscriptions
                </button>
              </div>
            </div>

            <DataTable
              columns={[
                { key: "date", label: "Date", sortable: true },
                { key: "startTime", label: "Debut", sortable: true },
                { key: "endTime", label: "Fin", sortable: true },
                { key: "durationHours", label: "Duree", sortable: true, render: (row) => `${row.durationHours} h` },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => (
                    <div className="flex gap-2">
                      <button className="rounded-full bg-brand-100 px-3 py-1 text-brand-700" onClick={() => openEditSession(selectedGroup, row)}>
                        Modifier
                      </button>
                      <button className="rounded-full bg-rose-100 px-3 py-1 text-rose-700" onClick={() => deleteSession(selectedGroup, row)}>
                        Supprimer
                      </button>
                    </div>
                  )
                }
              ]}
              rows={selectedGroup.sessions || []}
              defaultSort={{ key: "date", direction: "asc" }}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
