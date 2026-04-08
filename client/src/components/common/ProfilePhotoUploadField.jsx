import { ImagePlus, Upload } from "lucide-react";

export const ProfilePhotoUploadField = ({ selectedFile, onFileChange, helperText = "JPG, PNG ou WebP jusqu'a 5 Mo" }) => (
  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-white p-3 text-brand-500 shadow-sm">
        <ImagePlus size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">Photo de profil</p>
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      </div>
    </div>

    <div className="mt-4 grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-slate-800">{selectedFile ? selectedFile.name : "Aucun fichier selectionne"}</p>
        <p className="mt-1 text-xs text-slate-500">Le visuel sera mis a jour juste apres l'enregistrement.</p>
      </div>

      <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-fit">
        <Upload size={16} />
        Choisir une image
        <input className="sr-only" type="file" accept="image/*" onChange={(event) => onFileChange(event.target.files?.[0] || null)} />
      </label>
    </div>
  </div>
);
