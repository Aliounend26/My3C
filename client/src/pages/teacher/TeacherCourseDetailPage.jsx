import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { resourceService } from "../../services/resourceService";

const getErrorMessage = (error) => error?.response?.data?.message || error?.message || "Impossible de charger ce cours.";

export const TeacherCourseDetailPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [sectionItems, setSectionItems] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [courseResult, sectionsResult, announcementsResult, studentsResult, quizResultsResult] = await Promise.allSettled([
          resourceService.get(`/courses/groups/${courseId}`),
          resourceService.get(`/sections?course=${courseId}`),
          resourceService.get(`/announcements?course=${courseId}`),
          resourceService.get("/students"),
          resourceService.get("/quizzes/results")
        ]);

        if (courseResult.status !== "fulfilled") throw courseResult.reason;
        if (sectionsResult.status !== "fulfilled") throw sectionsResult.reason;

        const nextCourse = courseResult.value;
        const nextSections = sectionsResult.value;
        const itemGroups = await Promise.all(
          nextSections.map((section) =>
            resourceService.get(`/sections/${section._id}/items`).catch(() => [])
          )
        );

        const nextStudents = studentsResult.status === "fulfilled" ? studentsResult.value : [];
        const nextQuizResults = quizResultsResult.status === "fulfilled" ? quizResultsResult.value : [];

        setCourse(nextCourse);
        setSections(nextSections);
        setSectionItems(itemGroups.flat());
        setAnnouncements(announcementsResult.status === "fulfilled" ? announcementsResult.value : []);
        setQuizResults(nextQuizResults.filter((result) => result.quiz?.course?._id === courseId || result.quiz?.course === courseId));
        setStudents(
          nextStudents.filter((student) => {
            const assigned = (student.assignedCourses || []).some((assignedCourse) => (assignedCourse._id || assignedCourse).toString() === courseId);
            const classMatch = (student.classrooms || []).some(
              (classroom) => (classroom._id || classroom).toString() === (nextCourse.classRoom?._id || nextCourse.classRoom)?.toString()
            );
            return assigned || classMatch;
          })
        );
      } catch (loadError) {
        console.error("Erreur chargement du cours formateur :", loadError);
        setCourse(null);
        setSections([]);
        setSectionItems([]);
        setAnnouncements([]);
        setStudents([]);
        setQuizResults([]);
        setError(getErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [courseId]);

  const averageSuccess = useMemo(() => {
    if (!quizResults.length) return 0;
    return Math.round(
      quizResults.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) / quizResults.length
    );
  }, [quizResults]);

  if (loading) return <Loader label="Chargement du cours..." />;
  if (error) return <EmptyState title="Erreur de chargement" description={error} />;
  if (!course) return <EmptyState title="Cours introuvable" description="Ce cours n'a pas pu etre charge." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pilotage pedagogique"
        title={course.title}
        description={course.description || "Structurez vos sections, publiez vos lecons et suivez les performances de ce cours."}
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-card p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-500">{course.formation?.name || "Formation"}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">{course.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Formateur: {course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : course.instructor || "-"}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{students.length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Etudiants</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{sections.length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sections</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{sectionItems.length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Items</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-center">
              <p className="text-2xl font-bold text-slate-950">{sectionItems.filter((item) => item.type === "quiz").length}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quiz</p>
            </div>
          </div>
        </section>

        <section className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-950">Performance moyenne</h3>
          <div className="mt-4">
            <ProgressBadge rate={averageSuccess} />
          </div>
          <div className="mt-5 grid gap-3">
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to={`/teacher/sections?course=${courseId}`}>
              Gerer les sections
            </Link>
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to={`/teacher/lessons?course=${courseId}`}>
              Gerer les lecons
            </Link>
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to="/teacher/quizzes">
              Gerer les quiz
            </Link>
            <Link className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" to="/teacher/announcements">
              Publier une annonce
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Sections du cours</h3>
          {sections.length ? (
            <div className="space-y-3">
              {sections.map((section) => (
                <div key={section._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{section.description || "Section pedagogique du parcours."}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                    Ordre {section.order} · {sectionItems.filter((item) => (item.section?._id || item.section) === section._id).length} items
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune section" description="Ajoutez la structure de votre cours en sections." />
          )}
        </section>

        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Etudiants inscrits</h3>
          {students.length ? (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                  <p className="mt-1 text-sm text-slate-600">{student.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun etudiant" description="Aucun etudiant n'est encore rattache a ce cours." />
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Derniers resultats de quiz</h3>
          {quizResults.length ? (
            <div className="space-y-3">
              {quizResults.slice(0, 6).map((result) => (
                <div key={result._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{result.student?.firstName} {result.student?.lastName}</p>
                  <p className="mt-1 text-sm text-slate-600">{result.quiz?.title || "Quiz"}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">{result.score}/{result.maxScore}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun resultat" description="Les performances etudiantes apparaitront ici apres les premieres soumissions." />
          )}
        </section>

        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Annonces du cours</h3>
          {announcements.length ? (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{announcement.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{announcement.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune annonce" description="Vos annonces pedagogiques apparaitront ici." />
          )}
        </section>
      </div>
    </div>
  );
};
