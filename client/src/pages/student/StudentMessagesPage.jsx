import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { LoadingButton } from "../../components/common/LoadingButton";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { resourceService } from "../../services/resourceService";

const formatDate = (value) => new Date(value).toLocaleString("fr-FR");
const toRefId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (value._id || value.id || value)?.toString?.() || "";
};
const getFullName = (person) => `${person?.firstName || ""} ${person?.lastName || ""}`.trim() || "Utilisateur";

const MessageCard = ({ message, currentUserId }) => {
  const isDirect = message.deliveryType === "direct";
  const isSentByCurrentUser = toRefId(message.from) === currentUserId;
  const senderName = isSentByCurrentUser ? "Vous" : getFullName(message.from);
  const recipientName = getFullName(message.to);
  const contextLabel =
    message.deliveryType === "class"
      ? `Message de classe · ${message.classRoom?.name || "-"}`
      : message.deliveryType === "course"
        ? `Message de cours · ${message.course?.title || "-"}`
        : "Message individuel";

  return (
    <article className="rounded-3xl border border-slate-200 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Emetteur: {senderName}</p>
          {isDirect ? <p className="text-sm text-slate-600">Destinataire: {recipientName}</p> : null}
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{contextLabel}</span>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-600">{message.body}</p>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
        {(message.subject || message.course?.title || "Conversation")} · {formatDate(message.createdAt)}
      </p>
    </article>
  );
};

export const StudentMessagesPage = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState(null);
  const [messages, setMessages] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ course: "", to: "", body: "" });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "" });

  const loadData = async () => {
    const [announcementsData, messagesData, coursesData, studentsData] = await Promise.all([
      resourceService.get("/announcements"),
      resourceService.get("/messages"),
      resourceService.get("/courses/groups"),
      resourceService.get("/students")
    ]);

    setAnnouncements(announcementsData);
    setMessages(messagesData);
    setCourses(coursesData);
    setStudents(studentsData);
    setFormData((current) => ({
      ...current,
      course: current.course || coursesData[0]?._id || "",
      to: current.to || ""
    }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentStudent = useMemo(() => {
    const currentUserId = user?.id || user?._id;
    return students.find((student) => student._id === currentUserId) || null;
  }, [students, user?.id, user?._id]);

  const recipientOptions = useMemo(() => {
    if (!students.length || !currentStudent) return [];

    const currentUserId = user?.id || user?._id;
    const currentFormationIds = new Set((currentStudent.formations || user?.formations || []).map((formation) => toRefId(formation)).filter(Boolean));
    const selectedCourse = courses.find((course) => course._id === formData.course);

    const sameFormationStudents = students.filter((student) => {
      if (student._id === currentUserId) return false;
      const studentFormationIds = (student.formations || []).map((formation) => toRefId(formation)).filter(Boolean);
      return studentFormationIds.some((formationId) => currentFormationIds.has(formationId));
    });

    const teacherOption =
      selectedCourse?.teacher &&
      (currentStudent.assignedCourses || []).some((course) => toRefId(course) === selectedCourse._id)
        ? [
            {
              _id: selectedCourse.teacher._id,
              firstName: selectedCourse.teacher.firstName,
              lastName: selectedCourse.teacher.lastName,
              role: "teacher"
            }
          ]
        : [];

    const recipientsById = new Map();
    [...teacherOption, ...sameFormationStudents].forEach((recipient) => {
      if (recipient?._id) {
        recipientsById.set(recipient._id, recipient);
      }
    });

    return [...recipientsById.values()];
  }, [courses, currentStudent, formData.course, students, user?.formations, user?.id, user?._id]);

  const groupedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }, [messages]);
  const currentUserId = user?.id || user?._id || "";
  const directMessages = useMemo(() => groupedMessages.filter((message) => message.deliveryType === "direct"), [groupedMessages]);
  const formationMessages = useMemo(
    () => groupedMessages.filter((message) => message.deliveryType === "course" || message.deliveryType === "class"),
    [groupedMessages]
  );

  const sendMessage = async (event) => {
    event.preventDefault();
    setFeedback({ error: "", success: "" });
    setSending(true);

    try {
      await resourceService.post("/messages", formData);
      setFeedback({ error: "", success: "Message envoye." });
      setFormData({ course: courses?.[0]?._id || "", to: "", body: "" });
      await loadData();
      window.setTimeout(() => {
        setShowModal(false);
        setFeedback((current) => ({ ...current, success: "" }));
      }, 900);
    } catch (error) {
      setFeedback({
        error: error.response?.data?.message || "Impossible d'envoyer le message.",
        success: ""
      });
    } finally {
      setSending(false);
    }
  };

  if (!announcements || !messages || !courses.length || !students.length) return <Loader label="Chargement de vos messages..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Messages et annonces"
        description="Consultez les annonces de vos cours et distinguez clairement les messages individuels, de cours ou de classe."
        actions={
          <button
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            onClick={() => {
              setFeedback({ error: "", success: "" });
              setShowModal(true);
            }}
          >
            Nouveau message
          </button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Annonces de cours</h2>
          {announcements.length ? (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <article key={announcement._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{announcement.title}</p>
                    {announcement.pinned ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                        Important
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{announcement.body}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                    {(announcement.course?.title || "Cours")} · {formatDate(announcement.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucune annonce" description="Les annonces de vos cours apparaitront ici." />
          )}
        </section>

        <section className="glass-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Messages</h2>
          {groupedMessages.length ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">Messages individuels</h3>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{directMessages.length}</span>
                </div>
                {directMessages.length ? (
                  <div className="space-y-3">
                    {directMessages.map((message) => (
                      <MessageCard key={message._id} message={message} currentUserId={currentUserId} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    Aucun message individuel pour le moment.
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">Messages de la formation</h3>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{formationMessages.length}</span>
                </div>
                {formationMessages.length ? (
                  <div className="space-y-3">
                    {formationMessages.map((message) => (
                      <MessageCard key={message._id} message={message} currentUserId={currentUserId} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    Aucun message collectif lie a votre formation pour le moment.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState title="Aucun message" description="Vos echanges lies a vos cours apparaitront ici." />
          )}
        </section>
      </div>

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSending(false);
          setFeedback({ error: "", success: "" });
        }}
        title="Envoyer un message"
      >
        <form onSubmit={sendMessage} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Cours</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={formData.course}
              onChange={(e) => setFormData((current) => ({ ...current, course: e.target.value, to: "" }))}
              required
            >
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Destinataire</span>
            <select
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={formData.to}
              onChange={(e) => setFormData((current) => ({ ...current, to: e.target.value }))}
              required
            >
              <option value="">Choisir un destinataire</option>
              {recipientOptions.map((recipient) => (
                <option key={recipient._id} value={recipient._id}>
                  {recipient.firstName} {recipient.lastName} {recipient.role === "teacher" ? "(Formateur)" : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3"
              value={formData.body}
              onChange={(e) => setFormData((current) => ({ ...current, body: e.target.value }))}
              required
            />
          </label>

          {feedback.error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback.error}</div> : null}
          {feedback.success ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback.success}</div> : null}

          <LoadingButton type="submit" loading={sending} loadingText="Envoi en cours..." className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            Envoyer
          </LoadingButton>
        </form>
      </Modal>
    </div>
  );
};
