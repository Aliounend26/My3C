import { useEffect, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { ProfilePhotoUploadField } from "../../components/common/ProfilePhotoUploadField";
import { useAuth } from "../../hooks/useAuth";
import { getMediaUrl } from "../../utils/media";

export const ProfilePage = () => {
  const { user, updateProfile, updatePassword, uploadAvatar } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: ""
  });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || ""
    });
    setSelectedAvatar(null);
  }, [user]);

  const formationsLabel = user?.formations?.map((formation) => formation.name).join(", ") || "-";
  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`;

  const submitProfile = async (event) => {
    event.preventDefault();
    setError("");
    setProfileMessage("");

    try {
      if (selectedAvatar) {
        await uploadAvatar(selectedAvatar);
      }

      await updateProfile(profileForm);
      setProfileMessage("Profil mis a jour avec succes.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Mise a jour du profil impossible");
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setError("");
    setPasswordMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("La confirmation du nouveau mot de passe ne correspond pas.");
      return;
    }

    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setPasswordMessage("Mot de passe mis a jour avec succes.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Mise a jour du mot de passe impossible");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profil"
        title="Mon profil"
        description="Gardez votre profil et votre photo a jour pour suivre votre progression plus facilement."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="glass-card flex h-full flex-col justify-between gap-6 p-6">
          <div className="space-y-5">
            <div className="inline-flex rounded-full bg-gradient-to-br from-brand-100 to-brand-50 p-1 shadow-soft">
              {user?.avatar ? (
                <img
                  src={getMediaUrl(user.avatar)}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-white"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-3xl font-bold text-slate-500 ring-4 ring-white">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl bg-slate-50/80 p-4">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Matricule</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{user?.matricule || "-"}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Formations</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{formationsLabel}</p>
            </div>
          </div>
        </aside>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <form className="glass-card border border-white/60 p-6 shadow-soft" onSubmit={submitProfile}>
            <h3 className="text-xl font-semibold text-slate-950">Informations personnelles</h3>
            <p className="mt-1 text-sm text-slate-500">Mettez a jour vos coordonnees et votre photo de profil.</p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Prenom"
                value={profileForm.firstName}
                onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
                required
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Nom"
                value={profileForm.lastName}
                onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
                required
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 md:col-span-2"
                placeholder="Telephone"
                value={profileForm.phone}
                onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>

            <div className="mt-4">
              <ProfilePhotoUploadField selectedFile={selectedAvatar} onFileChange={setSelectedAvatar} />
            </div>

            <button className="mt-5 w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">
              Mettre a jour le profil
            </button>

            {profileMessage ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileMessage}</div> : null}
          </form>

          <form className="glass-card border border-white/60 p-6 shadow-soft" onSubmit={submitPassword}>
            <h3 className="text-xl font-semibold text-slate-950">Mot de passe</h3>
            <p className="mt-1 text-sm text-slate-500">Choisissez un mot de passe robuste pour proteger votre compte.</p>

            <div className="mt-6 grid gap-4">
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                type="password"
                placeholder="Mot de passe actuel"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                required
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                type="password"
                placeholder="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                required
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                required
              />
              <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Changer le mot de passe</button>
            </div>
            {passwordMessage ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordMessage}</div> : null}
          </form>
        </div>
      </div>

      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    </div>
  );
};
