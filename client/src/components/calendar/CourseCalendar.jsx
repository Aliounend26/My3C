import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getCourseTypeLabel } from "../../utils/courseType";
import { toMonthInputValue } from "../../utils/calendar";

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const buildMonthLabel = (monthDate) =>
  monthDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });

const buildCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();
  const days = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    days.push(date.toISOString().slice(0, 10));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
};

export const CourseCalendar = ({
  monthDate,
  courses,
  onPreviousMonth,
  onNextMonth,
  onChangeMonth,
  onJumpToDate,
  selectedDate = "",
  onSelectDate,
  onAddCourse,
  actionLabel = "Ajouter"
}) => {
  const days = buildCalendarDays(monthDate);
  const today = new Date().toISOString().slice(0, 10);
  const coursesByDate = courses.reduce((accumulator, course) => {
    if (!accumulator[course.date]) {
      accumulator[course.date] = [];
    }

    accumulator[course.date].push(course);
    accumulator[course.date].sort((left, right) => left.startTime.localeCompare(right.startTime));
    return accumulator;
  }, {});

  return (
    <section className="glass-card overflow-hidden p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-500">Calendrier</p>
          <h2 className="mt-2 text-2xl font-semibold capitalize text-slate-950">{buildMonthLabel(monthDate)}</h2>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              type="month"
              value={toMonthInputValue(monthDate)}
              onChange={(event) => onChangeMonth?.(event.target.value)}
            />
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
              type="date"
              value={selectedDate}
              onChange={(event) => onJumpToDate?.(event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
          <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700" onClick={onPreviousMonth} aria-label="Mois precedent">
            <ChevronLeft size={18} />
          </button>
          <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-700" onClick={onNextMonth} aria-label="Mois suivant">
            <ChevronRight size={18} />
          </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="rounded-2xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-36 rounded-3xl bg-transparent" />;
          }

          const dailyCourses = coursesByDate[date] || [];
          const isToday = date === today;

          return (
            <div
              key={date}
              className={`min-h-36 rounded-3xl border p-3 transition ${
                isToday ? "border-brand-300 bg-brand-50/70" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button className="text-left" onClick={() => onSelectDate?.(date)}>
                  <p className={`text-sm font-semibold ${isToday ? "text-brand-700" : "text-slate-900"}`}>{Number(date.slice(-2))}</p>
                  <p className="text-xs text-slate-400">{dailyCourses.length} cours</p>
                </button>

                {onAddCourse ? (
                  <button
                    className="inline-flex items-center gap-1 rounded-full bg-slate-950 px-2.5 py-1 text-xs font-medium text-white"
                    onClick={() => onAddCourse(date)}
                  >
                    <Plus size={12} />
                    {actionLabel}
                  </button>
                ) : null}
              </div>

              <div className="mt-3 space-y-2">
                {dailyCourses.slice(0, 3).map((course) => (
                  <button
                    key={course._id}
                    className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
                    onClick={() => onSelectDate?.(date)}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-500">
                      {course.startTime} - {course.endTime}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{course.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{getCourseTypeLabel(course)}</p>
                  </button>
                ))}

                {dailyCourses.length > 3 ? (
                  <button className="text-xs font-medium text-brand-600" onClick={() => onSelectDate?.(date)}>
                    Voir {dailyCourses.length - 3} autre(s) cours
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
