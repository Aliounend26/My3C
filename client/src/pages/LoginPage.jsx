import { useState } from "react";
import { Navigate } from "react-router-dom";
import { BrandLogo } from "../components/common/BrandLogo";
import { LoadingButton } from "../components/common/LoadingButton";
import { useAuth } from "../hooks/useAuth";

const redirectByRole = (role) => {
  if (role === "superadmin") return "/superadmin";
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/teacher";
  return "/student";
};

export const LoginPage = () => {
  const { login, user } = useAuth();
  const [form, setForm] = useState({ email: "admin@mypresence.local", password: "Admin123!" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={redirectByRole(user.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const currentUser = await login(form);
      window.location.href = redirectByRole(currentUser.role);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_35%),linear-gradient(180deg,_#eff6ff_0%,_#ffffff_100%)] p-4">
      <div className="grid max-w-5xl overflow-hidden rounded-[32px] border border-white/60 bg-white shadow-soft lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_60%,_#60a5fa_100%)] p-12 text-white lg:block">
          <BrandLogo className="rounded-3xl bg-white/95 px-4 py-4 shadow-lg" alt="Logo My 3C" />
          <h1 className="mt-8 text-5xl font-bold leading-tight">Une plateforme My 3C tout-en-un</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-blue-50/90">
            Gere la presence par QR code, les cours, les sections, les lecons, les quiz, les videos YouTube, les ressources
            pedagogiques et les tableaux de bord par role dans une meme experience moderne.
          </p>
          <div className="mt-8 grid gap-3">
            <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-100">Roles</p>
              <p className="mt-2 text-sm text-white/90">SuperAdmin, Admin, Professeur et Etudiant avec routes protegees.</p>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/10 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-100">E-learning</p>
              <p className="mt-2 text-sm text-white/90">Cours, sections, lecons, supports, videos, annonces et quiz interactifs.</p>
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-500">Connexion securisee</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Bienvenue sur My 3C</h2>
          <p className="mt-3 text-sm text-slate-500">Utilisez un compte de demonstration pour explorer les espaces pedagogiques et administratifs.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                type="email"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</span>
              <input
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                type="password"
                required
              />
            </label>

            {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

            <LoadingButton type="submit" loading={loading} loadingText="Connexion..." className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Se connecter
            </LoadingButton>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p>SuperAdmin: superadmin@mypresence.local / SuperAdmin123!</p>
            <p>Admin: admin@mypresence.local / Admin123!</p>
            <p>Professeur: teacher@mypresence.local / Teacher123!</p>
            <p>Etudiant: sara@mypresence.local / Student123!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
