import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { Modal } from "../../components/common/Modal";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";

export const TeacherAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState(null);
  const [courses, setCourses] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({ title: "", body: "", course: "", pinned: false });

  const load = async () => {
    const [announcementsData, coursesData] = await Promise.all([resourceService.get("/announcements"), resourceService.get("/courses/groups")]);
    setAnnouncements(announcementsData);
    setCourses(coursesData);
    setFormData((current) => ({ ...current, course: current.course || coursesData[0]?._id || "" }));
  };

  useEffect(() => {
    load();
  }, []);

  const pinnedCount = useMemo(() => announcements?.filter((announcement) => announcement.pinned).length || 0, [announcements]);

  const submitAnnouncement = async (event) => {
    event.preventDefault();

    if (editingAnnouncement) {
      await resourceService.put(`/announcements/${editingAnnouncement._id}`, formData);
    } else {
      await resourceService.post("/announcements", formData);
    }

    setShowModal(false);
    setEditingAnnouncement(null);
    setFormData({ title: "", body: "", course: courses?.[0]?._id || "", pinned: false });
    await load();
  };

  const editAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      course: announcement.course?._id || announcement.course,
      pinned: announcement.pinned
    });
    setShowModal(true);
  };

  const removeAnnouncement = async (announcementId) => {
    if (!window.confirm("Supprimer cette annonce ?")) return;
    await resourceService.delete(`/announcements/${announcementId}`);
    await load();
  };

  if (!announcements || !courses) return <Loader label="Chargement des annonces..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Communication"
        title="Annonces pedagogiques"
        description="Publiez des informations importantes, epinglez les messages essentiels et gardez vos etudiants alignes."
        actions={
          <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => setShowModal(true)}>
            Nouvelle annonce
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Total annonces</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{announcements.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Messages epingles</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{pinnedCount}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm text-slate-500">Cours concernes</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{new Set(announcements.map((announcement) => announcement.course?._id || announcement.course)).size}</p>
        </div>
      </div>

      {announcements.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {announcements.map((announcement) => (
            <article key={announcement._id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{announcement.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{announcement.course?.title || "Cours"}</p>
                </div>
                {announcement.pinned ? (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                    Epingle
                  </span>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{announcement.body}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => editAnnouncement(announcement)}>
                  Modifier
                </button>
                <button className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={() => removeAnnouncement(announcement._id)}>
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Aucune annonce" description="Publiez votre premiere annonce pour communiquer avec vos etudiants." />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingAnnouncement ? "Modifier l'annonce" : "Nouvelle annonce"}>
        <form onSubmit={submitAnnouncement} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Titre</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={formData.title} onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))} required />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Cours</span>
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={formData.course} onChange={(e) => setFormData((current) => ({ ...current, course: e.target.value }))} required>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>{course.title}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Message</span>
            <textarea className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3" value={formData.body} onChange={(e) => setFormData((current) => ({ ...current, body: e.target.value }))} required />
          </label>
          <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={formData.pinned} onChange={(e) => setFormData((current) => ({ ...current, pinned: e.target.checked }))} />
            Epingle au sommet des annonces
          </label>
          <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            {editingAnnouncement ? "Mettre a jour" : "Publier"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
