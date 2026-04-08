import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/common/BrandLogo";
import { Loader } from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";
import { resourceService } from "../services/resourceService";

const formatWindow = (course) => {
  if (!course) return "";
  return `${course.date} · ${course.startTime} - ${course.endTime}`;
};

export const QRAttendancePage = () => {
  const [searchParams] = useSearchParams();
  const { user, login, logout } = useAuth();
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  const token = searchParams.get("token") || "";
  const courseId = searchParams.get("courseId") || "";

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await resourceService.get(`/qr-codes/public/session?courseId=${encodeURIComponent(courseId)}&token=${encodeURIComponent(token)}`);
        setSessionData(data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Impossible de charger la seance QR");
      } finally {
        setLoading(false);
      }
    };

    if (!token || !courseId) {
      setLoading(false);
      setError("Lien QR incomplet");
      return;
    }

    loadSession();
  }, [courseId, token]);

  const canRegister = useMemo(() => {
    if (!sessionData || sessionData.isExpired || !sessionData.isActive) return false;
    return true;
  }, [sessionData]);

  const registerAttendance = async () => {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const attendance = await resourceService.post("/qr-codes/scan", {
        token,
        courseId
      });
      setMessage(`Presence enregistree pour "${attendance.course?.title}" a ${new Date(attendance.scannedAt).toLocaleString("fr-FR")}.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Enregistrement impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginAndRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const loggedUser = await login(credentials);

      if (loggedUser.role !== "student") {
        logout();
        setError("Seul un compte etudiant peut enregistrer une presence via ce QR code");
        return;
      }

      await registerAttendance();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Identification impossible");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Chargement de la seance QR..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_35%),linear-gradient(180deg,_#eff6ff_0%,_#ffffff_100%)] p-4">
      <div className="w-full max-w-4xl rounded-[32px] border border-white/60 bg-white p-8 shadow-soft lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5 rounded-[28px] bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_60%,_#60a5fa_100%)] p-8 text-white">
            <BrandLogo className="rounded-3xl bg-white/95 px-4 py-4 shadow-lg" alt="Logo My 3C" />
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-100">Pointage QR</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight">
                {sessionData?.course?.title || "Seance QR"}
              </h1>
            </div>
            <div className="space-y-2 text-sm text-blue-50/90">
              <p><span className="font-semibold text-white">Formation :</span> {sessionData?.course?.formation?.name || "-"}</p>
              <p><span className="font-semibold text-white">Seance :</span> {formatWindow(sessionData?.course)}</p>
              <p><span className="font-semibold text-white">Formateur :</span> {sessionData?.course?.instructor || "-"}</p>
              <p><span className="font-semibold text-white">Type :</span> {sessionData?.course?.courseType === "en_ligne" ? "En ligne" : "Presentiel (Lieu 3C)"}</p>
              <p><span className="font-semibold text-white">Expiration QR :</span> {sessionData?.expiresAt ? new Date(sessionData.expiresAt).toLocaleString("fr-FR") : "-"}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-brand-500">Enregistrer ma presence</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-950">Identification etudiant</h2>
              <p className="mt-3 text-sm text-slate-500">
                Connectez-vous avec votre compte etudiant pour enregistrer votre presence a cette seance.
              </p>
            </div>

            {!canRegister ? (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Ce QR code n'est plus actif ou la seance n'est plus disponible.
              </div>
            ) : null}

            {user?.role === "student" && canRegister ? (
              <button
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={submitting}
                onClick={registerAttendance}
              >
                {submitting ? "Enregistrement..." : "Enregistrer ma presence"}
              </button>
            ) : (
              <form className="space-y-5" onSubmit={handleLoginAndRegister}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email etudiant</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                    value={credentials.email}
                    onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
                    type="email"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-500"
                    value={credentials.password}
                    onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
                    type="password"
                    required
                  />
                </label>

                <button
                  className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={submitting || !canRegister}
                >
                  {submitting ? "Identification..." : "M'identifier et enregistrer ma presence"}
                </button>
              </form>
            )}

            {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
            {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
};
