import { useEffect, useMemo, useState } from "react";
import { CourseCalendar } from "../../components/calendar/CourseCalendar";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";
import { createInitialMonthDate, fromMonthInputValue, shiftMonth, toMonthDateFromDay } from "../../utils/calendar";
import { getCourseTypeLabel } from "../../utils/courseType";

export const StudentCalendarPage = () => {
  const [courses, setCourses] = useState(null);
  const [monthDate, setMonthDate] = useState(createInitialMonthDate());
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    resourceService.get("/courses").then(setCourses);
  }, []);

  const selectedCourses = useMemo(
    () => (courses || []).filter((course) => course.date === selectedDate).sort((left, right) => left.startTime.localeCompare(right.startTime)),
    [courses, selectedDate]
  );

  if (!courses) return <Loader label="Chargement du calendrier..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Mon calendrier"
        description="Retrouvez vos cours a venir dans un calendrier mensuel clair et facile a suivre."
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
      />

      <section className="glass-card p-5">
        <h3 className="text-lg font-semibold text-slate-950">{selectedDate ? `Cours du ${selectedDate}` : "Selectionnez un jour"}</h3>
        <p className="mt-1 text-sm text-slate-500">Cliquez sur une date pour voir les details de vos seances.</p>

        <div className="mt-4 grid gap-3">
          {selectedCourses.length ? (
            selectedCourses.map((course) => (
              <div key={course._id} className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-lg font-semibold text-slate-950">{course.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {course.startTime} - {course.endTime} · {course.formation?.name || "-"} · {getCourseTypeLabel(course)}
                </p>
                {course.description ? <p className="mt-2 text-sm text-slate-600">{course.description}</p> : null}
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Aucun cours prevu pour cette date.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
