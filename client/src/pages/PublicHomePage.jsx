import { ArrowRight, BarChart3, BookOpen, GraduationCap, MessagesSquare, QrCode, ShieldCheck, Video } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { BrandLogo } from "../components/common/BrandLogo";
import { useAuth } from "../hooks/useAuth";

const highlights = [
  {
    icon: QrCode,
    title: "Presence QR code",
    description: "Generation de QR codes temporaires, pointage horodate, gestion des retards et calcul automatique du taux."
  },
  {
    icon: BookOpen,
    title: "Parcours e-learning",
    description: "Formations, classes, cours, sections, lecons, ressources et progression dans une structure claire."
  },
  {
    icon: Video,
    title: "Contenus multimedia",
    description: "Supports de cours, liens externes, documents et videos YouTube integrees par cours, section ou lecon."
  },
  {
    icon: MessagesSquare,
    title: "Communication pedagogique",
    description: "Annonces de cours, messages formateur-etudiant et experience de suivi proche d'une plateforme premium."
  }
];

const roleCards = [
  {
    role: "SuperAdmin",
    description: "Pilote tous les comptes, supervise les statistiques globales et gouverne la plateforme."
  },
  {
    role: "Admin",
    description: "Structure les formations, les classes, les cours, les seances et la gouvernance pedagogique."
  },
  {
    role: "Professeur",
    description: "Publie contenus, quiz, ressources, videos et annonces pour ses cours."
  },
  {
    role: "Etudiant",
    description: "Consulte ses parcours, repond aux quiz, suit sa progression et scanne ses presences."
  }
];

const statCards = [
  { label: "Espaces role", value: "4" },
  { label: "Modules coeur", value: "8+" },
  { label: "Stack moderne", value: "React + Express" }
];

const redirectByRole = (role) => {
  if (role === "superadmin") return "/superadmin";
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/student";
};

export const PublicHomePage = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to={redirectByRole(user.role)} replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_30%),linear-gradient(180deg,_#f7fbff_0%,_#eef5ff_100%)] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 lg:px-8">
        <BrandLogo className="rounded-3xl bg-white/90 px-4 py-3 shadow-soft" />
        <div className="flex items-center gap-3">
          <Link className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700" to="/qr-attendance">
            Scanner un QR
          </Link>
          <Link className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white" to="/login">
            Se connecter
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
        <section className="grid gap-8 py-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">My 3C Learning Platform</p>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-slate-950 lg:text-6xl">
              Presence, pedagogie et e-learning dans une seule plateforme.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              My 3C combine la gestion de presence par QR code, l'organisation des parcours de formation, la diffusion de
              contenus pedagogiques et le suivi de progression pour les apprenants comme pour l'administration.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-soft" to="/login">
                Acceder a la plateforme
                <ArrowRight size={16} />
              </Link>
              <Link className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700" to="/qr-attendance">
                Ouvrir le pointage QR
              </Link>
            </div>
          </div>

          <div className="glass-card overflow-hidden p-6 lg:p-8">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_58%,_#38bdf8_100%)] p-6 text-white">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} />
                <p className="text-sm uppercase tracking-[0.26em] text-blue-100">Architecture securisee</p>
              </div>
              <p className="mt-5 text-2xl font-semibold">JWT, roles, dashboards et modules pedagogiques relies autour d'un meme noyau metier.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {statCards.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/15 bg-white/10 px-4 py-4">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="mt-1 text-sm text-blue-100">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map(({ icon: Icon, title, description }) => (
            <article key={title} className="glass-card p-6">
              <div className="inline-flex rounded-2xl bg-brand-50 p-3 text-brand-500">
                <Icon size={20} />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="glass-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Vision produit</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Un socle extensible pour un centre de formation moderne.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              L'application relie la gestion administrative, la vie de classe, les contenus de cours, les quiz et la communication
              pedagogique. Elle est pensee pour evoluer avec de nouvelles permissions, workflows et integrations.
            </p>
            <div className="mt-6 rounded-3xl bg-slate-950 px-5 py-5 text-sm text-slate-100">
              <div className="flex items-center gap-2 font-semibold">
                <BarChart3 size={16} />
                Dashboards par role
              </div>
              <p className="mt-2 leading-7 text-slate-300">
                Supervision globale, pilotage admin, suivi formateur et experience etudiant personnalisee.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roleCards.map((item) => (
              <article key={item.role} className="glass-card p-6">
                <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {item.role}
                </div>
                <p className="mt-4 text-base leading-7 text-slate-700">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 glass-card flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-brand-50 p-3 text-brand-500">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Pret a demarrer en local</h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                Le projet inclut un backend Express, un frontend React/Vite, les seeds de demonstration, l'authentification JWT et
                les modules metiers centraux attendus pour My 3C.
              </p>
            </div>
          </div>
          <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white" to="/login">
            Explorer maintenant
            <ArrowRight size={16} />
          </Link>
        </section>
      </main>
    </div>
  );
};
