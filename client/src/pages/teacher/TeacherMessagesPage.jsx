import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";

const defaultForm = {
  type: "student",
  studentId: "",
  courseId: "",
  classId: "",
  subject: "",
  body: ""
};

export const TeacherMessagesPage = () => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState(null);
  const [courses, setCourses] = useState(null);
  const [students, setStudents] = useState(null);
  const [classes, setClasses] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    const [messagesData, coursesData, studentsData] = await Promise.all([
      resourceService.get("/messages"),
      resourceService.get("/courses/groups"),
      resourceService.get("/students")
    ]);

    setMessages(messagesData);
    setCourses(coursesData);
    setStudents(studentsData.items || []);
    setClasses(studentsData.classes || []);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!courses || !students || !classes) return;

    const type = searchParams.get("type") || "student";
    const studentId = searchParams.get("studentId") || "";
    const courseId = searchParams.get("courseId") || courses[0]?._id || "";
    const classId = searchParams.get("classId") || classes[0]?._id || "";

    if (searchParams.get("open") === "1") {
      setFormData({
        type,
        studentId,
        courseId,
        classId,
        subject: "",
        body: ""
      });
      setShowModal(true);
    }
  }, [classes, courses, searchParams, students]);

  const studentOptions = useMemo(() => {
    if (!students || !courses) return [];

    if (!formData.courseId) {
      return students;
    }

    return students.filter((student) =>
      (student.teacherCourses || []).some((course) => (course._id || course).toString() === formData.courseId)
    );
  }, [courses, formData.courseId, students]);

  const sendMessage = async (event) => {
    event.preventDefault();
    setFeedback("");
    setError("");

    try {
      if (formData.type === "student") {
        await resourceService.post(`/messages/teacher/student/${formData.studentId}`, {
          courseId: formData.courseId,
          subject: formData.subject,
          body: formData.body
        });
      } else if (formData.type === "course") {
        await resourceService.post(`/messages/teacher/course/${formData.courseId}`, {
          subject: formData.subject,
          body: formData.body
        });
      } else {
        await resourceService.post(`/messages/teacher/class/${formData.classId}`, {
          subject: formData.subject,
          body: formData.body
        });
      }

      setShowModal(false);
      setFormData({
        ...defaultForm,
        courseId: courses?.[0]?._id || "",
        classId: classes?.[0]?._id || ""
      });
      setFeedback("Message envoye avec succes.");
      await load();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.message || "Impossible d'envoyer le message.");
    }
  };

  if (!messages || !courses || !students || !classes) return <Loader label="Chargement des messages..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Messagerie"
        title="Messages formateur"
        description="Envoyez des messages individuels, a tout un cours ou a toute une classe rattachee a vos cours."
        actions={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setFormData({
                ...defaultForm,
                courseId: courses[0]?._id || "",
                classId: classes[0]?._id || ""
              });
              setShowModal(true);
            }}
          >
            Nouveau message
          </button>
        }
      />

      {feedback ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div> : null}
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {messages.length ? (
        <div className="space-y-4">
          {messages
            .slice()
            .reverse()
            .map((message) => (
              <div key={message._id} className="glass-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {message.subject || `${message.from?.firstName || ""} ${message.from?.lastName || ""}`.trim()}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {message.deliveryType === "class"
                        ? `Classe · ${message.classRoom?.name || "-"}`
                        : message.deliveryType === "course"
                          ? `Cours · ${message.course?.title || "-"}`
                          : `Individuel · ${message.to?.firstName || ""} ${message.to?.lastName || ""}`.trim()}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{new Date(message.createdAt).toLocaleString("fr-FR")}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{message.body}</p>
              </div>
            ))}
        </div>
      ) : (
        <EmptyState title="Aucun message" description="Vos messages pedagogiques apparaitront ici." />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Envoyer un message">
        <form onSubmit={sendMessage} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Type d'envoi</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={formData.type}
              onChange={(e) => setFormData((current) => ({ ...current, type: e.target.value }))}
            >
              <option value="student">Etudiant individuel</option>
              <option value="course">Groupe d'un cours</option>
              <option value="class">Groupe d'une classe</option>
            </select>
          </label>

          {formData.type === "student" ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Cours</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={formData.courseId}
                  onChange={(e) => setFormData((current) => ({ ...current, courseId: e.target.value, studentId: "" }))}
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
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Etudiant</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                  value={formData.studentId}
                  onChange={(e) => setFormData((current) => ({ ...current, studentId: e.target.value }))}
                  required
                >
                  <option value="">Choisir un etudiant</option>
                  {studentOptions.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {formData.type === "course" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Cours</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={formData.courseId}
                onChange={(e) => setFormData((current) => ({ ...current, courseId: e.target.value }))}
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

          {formData.type === "class" ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Classe</span>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={formData.classId}
                onChange={(e) => setFormData((current) => ({ ...current, classId: e.target.value }))}
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
              value={formData.subject}
              onChange={(e) => setFormData((current) => ({ ...current, subject: e.target.value }))}
              placeholder="Objet du message"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
            <textarea className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" value={formData.body} onChange={(e) => setFormData((current) => ({ ...current, body: e.target.value }))} required />
          </label>
          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Envoyer</button>
        </form>
      </Modal>
    </div>
  );
};
