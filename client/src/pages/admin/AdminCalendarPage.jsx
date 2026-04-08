import { useEffect, useMemo, useState } from "react";
import { CourseCalendar } from "../../components/calendar/CourseCalendar";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";
import { createInitialMonthDate, fromMonthInputValue, shiftMonth, toMonthDateFromDay } from "../../utils/calendar";
import { courseTypeOptions, getCourseTypeLabel } from "../../utils/courseType";

const initialForm = {
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

export const AdminCalendarPage = () => {
  const [courses, setCourses] = useState([]);
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState(createInitialMonthDate());
  const [selectedDate, setSelectedDate] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    const [coursesData, formationsData] = await Promise.all([resourceService.get("/courses"), resourceService.get("/formations")]);
    setCourses(coursesData);
    setFormations(formationsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedCourses = useMemo(
    () => courses.filter((course) => course.date === selectedDate).sort((left, right) => left.startTime.localeCompare(right.startTime)),
    [courses, selectedDate]
  );

  const openCreateModal = (date) => {
    setForm((current) => ({ ...current, date }));
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    await resourceService.post("/courses", form);
    setOpen(false);
    setForm(initialForm);
    await loadData();
    setSelectedDate(form.date);
  };

  if (loading) return <Loader label="Chargement du calendrier..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planification"
        title="Calendrier des cours"
        description="Visualisez toutes les seances par mois et ajoutez un cours directement depuis une date du calendrier."
      />

      <CourseCalendar
        monthDate={monthDate}
        courses={courses}
        onPreviousMonth={() => setMonthDate((current) => shiftMonth(current, -1))}
        onNextMonth={() => setMonthDate((current) => shiftMonth(current, 1))}
        onChangeMonth={(value) => setMonthDate(fromMonthInputValue(value))}
        onJumpToDate={(value) => {
          setSelectedDate(value);
          if (value) {
            setMonthDate(toMonthDateFromDay(value));
          }
        }}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onAddCourse={openCreateModal}
        actionLabel="Cours"
      />

      <section className="glass-card p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{selectedDate ? `Cours du ${selectedDate}` : "Selectionnez un jour"}</h3>
            <p className="text-sm text-slate-500">Cliquez sur une date du calendrier pour afficher les seances prevues.</p>
          </div>
          {selectedDate ? (
            <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white" onClick={() => openCreateModal(selectedDate)}>
              Ajouter un cours a cette date
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3">
          {selectedCourses.length ? (
            selectedCourses.map((course) => (
              <div key={course._id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{course.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {course.startTime} - {course.endTime} · {course.formation?.name || "-"} · {getCourseTypeLabel(course)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-600">{course.instructor || "Formateur non renseigne"}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Aucun cours programme pour cette date.
            </div>
          )}
        </div>
      </section>

      <Modal
        open={open}
        title="Ajouter une seance depuis le calendrier"
        onClose={() => {
          setOpen(false);
          setForm(initialForm);
        }}
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Titre" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.courseType} onChange={(event) => setForm((current) => ({ ...current, courseType: event.target.value }))} required>
            {courseTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Formateur" value={form.instructor} onChange={(event) => setForm((current) => ({ ...current, instructor: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="time" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="time" value={form.endTime} onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} required />
          <input className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" type="number" step="0.5" value={form.durationHours} onChange={(event) => setForm((current) => ({ ...current, durationHours: Number(event.target.value) }))} required />
          <select className="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" value={form.formation} onChange={(event) => setForm((current) => ({ ...current, formation: event.target.value }))} required>
            <option value="">Choisir une formation</option>
            {formations.map((formation) => <option key={formation._id} value={formation._id}>{formation.name}</option>)}
          </select>
          <textarea className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2" placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white md:col-span-2">Enregistrer le cours</button>
        </form>
      </Modal>
    </div>
  );
};
