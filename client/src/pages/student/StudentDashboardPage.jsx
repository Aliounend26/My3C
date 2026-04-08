import { Bell, BookOpen, CalendarClock, GraduationCap, QrCode, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { StatCard } from "../../components/common/StatCard";
import { resourceService } from "../../services/resourceService";
import { useEffect, useMemo, useState } from "react";

const formatDateTime = (value) => new Date(value).toLocaleString("fr-FR");

export const StudentDashboardPage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    resourceService.get("/dashboard/student").then(setData);
  }, []);

  const upcomingPreview = useMemo(() => data?.upcomingCourses?.slice(0, 4) || [], [data]);

  if (!data) return <Loader label="Chargement du dashboard etudiant..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Apprentissage personnel"
        title={`Bonjour ${data.student.firstName}`}
        description="Retrouvez vos cours actifs, vos quiz en attente, vos annonces recentes et votre progression globale depuis un seul tableau de bord."
        actions={
          <Link className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" to="/student/scanner">
            Scanner un QR code
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-brand-500">Vue globale</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">Votre espace d'apprentissage</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Suivez votre presence, votre progression pedagogique et vos prochaines actions dans vos parcours My 3C.
              </p>
            </div>
            <div className="rounded-3xl bg-brand-50 p-4 text-brand-500">
              <GraduationCap size={28} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Taux de presence</p>
              <div className="mt-4">
                <ProgressBadge rate={data.summary.rate} />
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Progression globale</p>
              <div className="mt-4">
                <ProgressBadge rate={data.globalProgress} />
              </div>
            </div>
            <StatCard title="Cours actifs" value={data.quickStats.activeCourses} hint="Parcours disponibles" accent="bg-sky-500" />
            <StatCard title="Quiz en attente" value={data.quickStats.pendingQuizzes} hint="Evaluations a terminer" accent="bg-amber-500" />
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Acces rapides</h2>
              <p className="text-sm text-slate-500">Les points d'entree les plus utiles pour votre journee.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Link className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/student/courses">
              Ouvrir mes cours
            </Link>
            <Link className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/student/quiz-results">
              Voir mes notes et quiz termines
            </Link>
            <Link className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/student/messages">
              Consulter les annonces et messages
            </Link>
            <Link className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 hover:bg-slate-50" to="/student/attendances">
              Verifier mon historique de presence
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard title="Messages non lus" value={data.quickStats.unreadMessages} hint="Messages recus" accent="bg-fuchsia-500" />
            <StatCard title="Notifications" value={data.quickStats.unreadNotifications} hint="A lire" accent="bg-sky-500" />
            <StatCard title="Moyenne quiz" value={`${Math.round(data.quickStats.averageQuizScore)}%`} hint="Sur vos quiz termines" accent="bg-emerald-500" />
          </div>
        </section>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {data.courseCards.slice(0, 3).map((course) => (
          <article key={course._id} className="glass-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{course.formation?.name || "Formation"}</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">{course.title}</h3>
              </div>
              <BookOpen size={18} className="text-brand-500" />
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">{course.description || "Aucune description fournie."}</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="font-semibold text-slate-900">{course.sectionCount}</p>
                <p className="text-slate-500">Sections</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="font-semibold text-slate-900">{course.resourceCount}</p>
                <p className="text-slate-500">Supports</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3">
                <p className="font-semibold text-slate-900">{course.quizCount}</p>
                <p className="text-slate-500">Quiz</p>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBadge rate={course.progress} />
            </div>
            <Link className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" to={`/student/courses/${course._id}`}>
              Voir le cours
            </Link>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <CalendarClock size={18} className="text-brand-500" />
            <h3 className="text-lg font-semibold text-slate-950">Prochains cours</h3>
          </div>
          {upcomingPreview.length ? (
            <div className="space-y-3">
              {upcomingPreview.map((course) => (
                <div key={course._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{course.formation?.name || "-"}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">
                    {course.date} · {course.startTime} - {course.endTime}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun cours a venir" description="Votre planning a venir est vide pour le moment." />
          )}
        </section>

        <section className="glass-card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Bell size={18} className="text-brand-500" />
            <h3 className="text-lg font-semibold text-slate-950">Derniers messages et annonces</h3>
          </div>
          {data.recentAnnouncements.length || data.recentMessages.length ? (
            <div className="space-y-3">
              {data.recentAnnouncements.slice(0, 3).map((announcement) => (
                <div key={announcement._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{announcement.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{announcement.body}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{announcement.course?.title || "Annonce"}</p>
                </div>
              ))}
              {data.recentMessages.slice(0, 2).map((message) => (
                <div key={message._id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {(message.from?._id?.toString?.() || message.from?._id) === data.student.id.toString()
                      ? "Message envoye"
                      : `Message de ${message.from?.firstName || ""} ${message.from?.lastName || ""}`.trim()}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{message.body}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(message.createdAt)}</p>
                </div>
              ))}
              {data.recentNotifications.length ? (
                <div className="space-y-3 pt-4">
                  <h4 className="text-sm font-semibold text-slate-900">Dernieres notifications</h4>
                  {data.recentNotifications.map((notification) => (
                    <div key={notification._id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(notification.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState title="Aucun message recent" description="Vos messages et annonces apparaitront ici." />
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Quiz a faire</h3>
          {data.pendingQuizzes.length ? (
            <div className="space-y-3">
              {data.pendingQuizzes.map((quiz) => (
                <div key={quiz._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{quiz.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{quiz.description || "Quiz disponible dans votre parcours."}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {quiz.course?.title || "Cours"} · {quiz.durationMinutes} min
                    </span>
                    <Link className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white" to={`/student/quizzes/${quiz._id}`}>
                      Lancer
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun quiz en attente" description="Vous etes a jour sur vos evaluations publiees." />
          )}
        </section>

        <section className="glass-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-slate-950">Derniers supports publies</h3>
          {data.latestResources.length ? (
            <div className="space-y-3">
              {data.latestResources.map((resource) => (
                <a
                  key={resource._id}
                  href={resource.url || resource.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-3xl border border-slate-200 px-4 py-4 transition hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-900">{resource.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{resource.section?.title || resource.course?.title || "Support pedagogique"}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">{resource.type}</p>
                </a>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun support recent" description="Les nouveaux supports de cours apparaitront ici." />
          )}
        </section>
      </div>
    </div>
  );
};
