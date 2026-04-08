import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { SortSelect } from "../../components/common/SortSelect";
import { resourceService } from "../../services/resourceService";

const sortCourses = (rows, sorter) => {
  const items = [...rows];

  items.sort((left, right) => {
    if (sorter === "progress-desc") return right.progress - left.progress;
    if (sorter === "progress-asc") return left.progress - right.progress;
    if (sorter === "title-asc") return left.title.localeCompare(right.title, "fr");
    if (sorter === "title-desc") return right.title.localeCompare(left.title, "fr");
    return (left.formation?.name || "").localeCompare(right.formation?.name || "", "fr");
  });

  return items;
};

export const MyCoursesPage = () => {
  const [rows, setRows] = useState(null);
  const [sorter, setSorter] = useState("progress-desc");

  const sortedRows = useMemo(() => sortCourses(rows || [], sorter), [rows, sorter]);

  useEffect(() => {
    resourceService.get("/dashboard/student").then((response) => setRows(response.courseCards));
  }, []);

  if (!rows) return <Loader label="Chargement des cours..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Parcours"
        title="Mes cours"
        description="Retrouvez uniquement les cours auxquels vous etes inscrit, avec leur progression, leurs ressources et leurs quiz."
        actions={
          <SortSelect
            value={sorter}
            onChange={setSorter}
            options={[
              { value: "progress-desc", label: "Progression la plus elevee" },
              { value: "progress-asc", label: "Progression la plus faible" },
              { value: "title-asc", label: "Titre A a Z" },
              { value: "title-desc", label: "Titre Z a A" },
              { value: "formation-asc", label: "Formation A a Z" }
            ]}
          />
        }
      />

      {sortedRows.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {sortedRows.map((course) => (
            <article key={course._id} className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{course.formation?.name || "Formation"}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{course.title}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : "Formateur"}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-7 text-slate-600">{course.description || "Aucune description disponible."}</p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                  <p className="text-xl font-bold text-slate-950">{course.sectionCount}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sections</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                  <p className="text-xl font-bold text-slate-950">{course.resourceCount}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Supports</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                  <p className="text-xl font-bold text-slate-950">{course.quizCount}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Quiz</p>
                </div>
              </div>

              <div className="mt-5">
                <ProgressBadge rate={course.progress} />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" to={`/student/courses/${course._id}`}>
                  Voir le cours
                </Link>
                <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to="/student/quiz-results">
                  Voir mes notes
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucun cours disponible" description="Vos cours apparaitront ici une fois votre inscription pedagogique activee." />
      )}
    </div>
  );
};
