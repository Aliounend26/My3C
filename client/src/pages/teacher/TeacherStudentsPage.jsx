import { useEffect, useMemo, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { DataTable } from "../../components/tables/DataTable";
import { EmptyState } from "../../components/common/EmptyState";
import { resourceService } from "../../services/resourceService";

const emptyMessageForm = {
  type: "student",
  studentId: "",
  courseId: "",
  classId: "",
  subject: "",
  body: ""
};

export const TeacherStudentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState({ courseId: "", classId: "", search: "", email: "" });
  const [detailStudent, setDetailStudent] = useState(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageForm, setMessageForm] = useState(emptyMessageForm);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const load = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (nextFilters.courseId) params.set("courseId", nextFilters.courseId);
      if (nextFilters.classId) params.set("classId", nextFilters.classId);
      if (nextFilters.search) params.set("search", nextFilters.search);
      if (nextFilters.email) params.set("email", nextFilters.email);

      const [studentsData, coursesData] = await Promise.all([
        resourceService.get(`/students${params.toString() ? `?${params.toString()}` : ""}`),
        resourceService.get("/courses/groups")
      ]);

      setStudents(studentsData.items || []);
      setClasses(studentsData.classes || []);
      setCourses(coursesData);
    } catch (requestError) {
      console.error(requestError);
      setError("Impossible de charger les etudiants de vos cours.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
  }, []);

  const openStudentMessage = (student) => {
    setFeedback("");
    setMessageForm({
      type: "student",
      studentId: student._id,
      courseId: student.teacherCourses?.[0]?._id || "",
      classId: student.teacherClasses?.[0]?._id || "",
      subject: `Message pour ${student.firstName}`,
      body: ""
    });
    setMessageOpen(true);
  };

  const openCourseMessage = () => {
    setFeedback("");
    setMessageForm({
      type: "course",
      studentId: "",
      courseId: filters.courseId || courses[0]?._id || "",
      classId: "",
      subject: "",
      body: ""
    });
    setMessageOpen(true);
  };

  const openClassMessage = () => {
    setFeedback("");
    setMessageForm({
      type: "class",
      studentId: "",
      courseId: "",
      classId: filters.classId || classes[0]?._id || "",
      subject: "",
      body: ""
    });
    setMessageOpen(true);
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await load(filters);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setFeedback("");
    setError("");

    try {
      if (messageForm.type === "student") {
        await resourceService.post(`/messages/teacher/student/${messageForm.studentId}`, {
          courseId: messageForm.courseId,
          subject: messageForm.subject,
          body: messageForm.body
        });
      } else if (messageForm.type === "course") {
        await resourceService.post(`/messages/teacher/course/${messageForm.courseId}`, {
          subject: messageForm.subject,
          body: messageForm.body
        });
      } else {
        await resourceService.post(`/messages/teacher/class/${messageForm.classId}`, {
          subject: messageForm.subject,
          body: messageForm.body
        });
      }

      setFeedback("Message envoye avec succes.");
      setMessageOpen(false);
      setMessageForm(emptyMessageForm);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.message || "Impossible d'envoyer le message.");
    }
  };

  const rows = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        fullName: `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        primaryClass: student.teacherClasses?.[0]?.name || student.classrooms?.[0]?.name || "-",
        primaryCourse: student.teacherCourses?.[0]?.title || "-"
      })),
    [students]
  );

  if (loading) return <Loader label="Chargement des etudiants..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Suivi pedagogique"
        title="Mes etudiants"
        description="Retrouvez uniquement les etudiants rattaches a vos cours, filtrez-les et communiquez rapidement en individuel ou en groupe."
        actions={
          <>
            <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" onClick={openCourseMessage}>
              Message au cours
            </button>
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={openClassMessage}>
              Message a la classe
            </button>
          </>
        }
      />

      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}
      {feedback ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{feedback}</div> : null}

      <form className="glass-card grid gap-4 p-5 lg:grid-cols-5" onSubmit={handleFilterSubmit}>
        <select
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          value={filters.courseId}
          onChange={(event) => setFilters((current) => ({ ...current, courseId: event.target.value }))}
        >
          <option value="">Tous les cours</option>
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
        <select
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          value={filters.classId}
          onChange={(event) => setFilters((current) => ({ ...current, classId: event.target.value }))}
        >
          <option value="">Toutes les classes</option>
          {classes.map((classRoom) => (
            <option key={classRoom._id} value={classRoom._id}>
              {classRoom.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Nom de l'etudiant"
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Email"
          value={filters.email}
          onChange={(event) => setFilters((current) => ({ ...current, email: event.target.value }))}
        />
        <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Filtrer</button>
      </form>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Etudiants visibles</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{students.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Cours enseignes</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{courses.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Classes liees</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">{classes.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Progression moyenne</p>
          <p className="mt-3 text-3xl font-bold text-slate-950">
            {students.length ? (students.reduce((sum, student) => sum + (student.progressRate || 0), 0) / students.length).toFixed(1) : "0.0"}%
          </p>
        </div>
      </div>

      {rows.length ? (
        <DataTable
          columns={[
            {
              key: "student",
              label: "Etudiant",
              sortable: true,
              sortValue: (row) => row.fullName,
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {(row.firstName?.[0] || "") + (row.lastName?.[0] || "")}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-950">{row.fullName}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </div>
                </div>
              )
            },
            { key: "primaryClass", label: "Classe", sortable: true },
            { key: "primaryCourse", label: "Cours", sortable: true },
            {
              key: "progressRate",
              label: "Progression",
              sortable: true,
              render: (row) => <span className="font-semibold text-slate-900">{Number(row.progressRate || 0).toFixed(1)}%</span>
            },
            {
              key: "attendanceRate",
              label: "Presence",
              sortable: true,
              render: (row) => <span className="font-semibold text-slate-900">{Number(row.attendanceRate || 0).toFixed(1)}%</span>
            },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-full bg-slate-100 px-3 py-1 text-xs" onClick={() => setDetailStudent(row)}>
                    Fiche
                  </button>
                  <button className="rounded-full bg-slate-950 px-3 py-1 text-xs text-white" onClick={() => openStudentMessage(row)}>
                    Message
                  </button>
                </div>
              )
            }
          ]}
          rows={rows}
          defaultSort={{ key: "student", direction: "asc" }}
        />
      ) : (
        <EmptyState title="Aucun etudiant trouve" description="Ajustez vos filtres ou attendez l'inscription d'etudiants sur vos cours." />
      )}

      <Modal open={Boolean(detailStudent)} onClose={() => setDetailStudent(null)} title="Fiche etudiant">
        {detailStudent ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-950">
                {detailStudent.firstName} {detailStudent.lastName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{detailStudent.email}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Progression</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{Number(detailStudent.progressRate || 0).toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Presence</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{Number(detailStudent.attendanceRate || 0).toFixed(1)}%</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Quiz</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{Number(detailStudent.averageQuizScore || 0).toFixed(1)}%</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Cours avec vous</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detailStudent.teacherCourses?.map((course) => (
                  <span key={course._id} className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                    {course.title}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Classes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detailStudent.teacherClasses?.map((classRoom) => (
                  <span key={classRoom._id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {classRoom.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Indicateurs rapides</p>
              <div className="mt-4">
                <ProgressBadge rate={detailStudent.progressRate || 0} />
              </div>
              <p className="mt-4 text-sm text-slate-500">
                {detailStudent.attendanceCount || 0} pointage(s) enregistre(s) et {detailStudent.quizResultsCount || 0} resultat(s) de quiz sur vos cours.
              </p>
            </div>

            <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => openStudentMessage(detailStudent)}>
              Envoyer un message
            </button>
          </div>
        ) : null}
      </Modal>

      <Modal open={messageOpen} onClose={() => setMessageOpen(false)} title="Nouveau message">
        <form className="space-y-4" onSubmit={handleSendMessage}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Type d'envoi</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={messageForm.type}
              onChange={(event) => setMessageForm((current) => ({ ...current, type: event.target.value }))}
            >
              <option value="student">Etudiant individuel</option>
              <option value="course">Groupe d'un cours</option>
              <option value="class">Groupe d'une classe</option>
            </select>
          </label>

          {messageForm.type === "student" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Etudiant</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={messageForm.studentId}
                onChange={(event) => setMessageForm((current) => ({ ...current, studentId: event.target.value }))}
                required
              >
                <option value="">Choisir un etudiant</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {messageForm.type === "student" || messageForm.type === "course" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Cours</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={messageForm.courseId}
                onChange={(event) => setMessageForm((current) => ({ ...current, courseId: event.target.value }))}
                required
              >
                <option value="">Choisir un cours</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {messageForm.type === "class" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Classe</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={messageForm.classId}
                onChange={(event) => setMessageForm((current) => ({ ...current, classId: event.target.value }))}
                required
              >
                <option value="">Choisir une classe</option>
                {classes.map((classRoom) => (
                  <option key={classRoom._id} value={classRoom._id}>
                    {classRoom.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Objet</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={messageForm.subject}
              onChange={(event) => setMessageForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Objet du message"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={messageForm.body}
              onChange={(event) => setMessageForm((current) => ({ ...current, body: event.target.value }))}
              required
            />
          </label>

          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Envoyer</button>
        </form>
      </Modal>
    </div>
  );
};
