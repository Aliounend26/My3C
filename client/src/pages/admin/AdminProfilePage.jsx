import { useEffect, useState } from "react";
import { PageHeader } from "../../components/common/PageHeader";
import { ProfilePhotoUploadField } from "../../components/common/ProfilePhotoUploadField";
import { useAuth } from "../../hooks/useAuth";
import { getMediaUrl } from "../../utils/media";

export const AdminProfilePage = () => {
  const { user, updateProfile, updatePassword, uploadAvatar } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
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
      email: user?.email || "",
      phone: user?.phone || ""
    });
    setSelectedAvatar(null);
  }, [user]);

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
        eyebrow="Compte administrateur"
        title="Mon profil"
        description="Mettez a jour votre compte administrateur, votre photo et vos acces sans quitter le back-office."
      />

      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <aside className="glass-card rounded-[28px] bg-[linear-gradient(180deg,rgba(37,99,235,0.08),rgba(255,255,255,0.92))] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="inline-flex rounded-full bg-white/90 p-1 shadow-soft">
                {user?.avatar ? (
                  <img
                    src={getMediaUrl(user.avatar)}
                    alt={`${profileForm.firstName} ${profileForm.lastName}`}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-white"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-bold text-slate-500 ring-4 ring-white">
                    {initials}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-2xl font-semibold text-slate-950">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="mt-1 break-all text-sm text-slate-600">{user?.email}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:min-w-[240px]">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Role</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Administrateur</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Telephone actuel</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{user?.phone || "-"}</p>
              </div>
            </div>
          </div>
        </aside>

        <form className="glass-card rounded-[28px] border border-slate-100 bg-white p-6 shadow-soft" onSubmit={submitProfile}>
              <h3 className="text-xl font-semibold text-slate-950">Informations personnelles</h3>
              <p className="mt-1 text-sm text-slate-500">Gardez vos coordonnees a jour pour une administration fluide.</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Prenom</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    value={profileForm.firstName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, firstName: event.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Nom</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    value={profileForm.lastName}
                    onChange={(event) => setProfileForm((current) => ({ ...current, lastName: event.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
                  <span className="font-medium text-slate-900">Email</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    type="email"
                    value={profileForm.email}
                    onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-600 md:col-span-2">
                  <span className="font-medium text-slate-900">Telephone</span>
                  <input
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    type="tel"
                    inputMode="tel"
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </label>
              </div>

              <div className="mt-4">
                <ProfilePhotoUploadField selectedFile={selectedAvatar} onFileChange={setSelectedAvatar} />
              </div>

              <button className="mt-5 w-full rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20">
                Mettre a jour le profil
              </button>

              {profileMessage ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{profileMessage}</div> : null}
        </form>

        <form className="glass-card rounded-[28px] border border-slate-100 bg-white p-6 shadow-soft" onSubmit={submitPassword}>
          <h3 className="text-xl font-semibold text-slate-950">Mot de passe</h3>
          <p className="mt-1 text-sm text-slate-500">Renforcez la securite de votre acces administrateur.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Mot de passe actuel</span>
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Nouveau mot de passe</span>
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">Confirmation</span>
              <input
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                required
              />
            </label>
          </div>

          <button className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white md:w-auto">
            Changer le mot de passe
          </button>

          {passwordMessage ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{passwordMessage}</div> : null}
        </form>
      </section>

      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    </div>
  );
};
