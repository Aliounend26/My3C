import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { resourceService } from "../../services/resourceService";

export const TeacherCoursesPage = () => {
  const [courses, setCourses] = useState(null);
  const [students, setStudents] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    Promise.all([resourceService.get("/courses/groups"), resourceService.get("/students"), resourceService.get("/quizzes/results")]).then(
      ([coursesData, studentsData, resultsData]) => {
        setCourses(coursesData);
        setStudents(studentsData.items || []);
        setResults(resultsData);
      }
    );
  }, []);

  if (!courses || !students || !results) return <Loader label="Chargement de vos cours..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestion pedagogique"
        title="Mes cours"
        description="Retrouvez les cours qui vous sont attribues, les etudiants rattaches, les sections, les quiz et le niveau de performance."
      />

      {courses.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {courses.map((course) => {
            const courseStudents = students.filter((student) =>
              (student.assignedCourses || []).some((assignedCourse) => (assignedCourse._id || assignedCourse).toString() === course._id)
            );
            const courseQuizResults = results.filter((result) => result.quiz?.course?._id === course._id || result.quiz?.course === course._id);
            const averageSuccess = courseQuizResults.length
              ? Math.round(courseQuizResults.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) / courseQuizResults.length)
              : 0;

            return (
              <article key={course._id} className="glass-card p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{course.formation?.name || "Formation"}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{course.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{course.description || "Cours pedagogique sous votre responsabilite."}</p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                    <p className="text-xl font-bold text-slate-950">{courseStudents.length}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Etudiants</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                    <p className="text-xl font-bold text-slate-950">{course.sessions?.length || 0}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Seances</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
                    <p className="text-xl font-bold text-slate-950">{courseQuizResults.length}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Resultats</p>
                  </div>
                </div>

                <div className="mt-5">
                  <ProgressBadge rate={averageSuccess} />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" to={`/teacher/courses/${course._id}`}>
                    Voir le detail
                  </Link>
                  <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to={`/teacher/sections?course=${course._id}`}>
                    Gerer les sections
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Aucun cours attribue" description="Vos cours apparaitront ici quand l'administration vous les attribuera." />
      )}
    </div>
  );
};
