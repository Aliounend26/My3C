import { useEffect, useState } from "react";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";

export const QRCodePage = () => {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState("");
  const [qrData, setQrData] = useState(null);

  useEffect(() => {
    resourceService.get("/courses").then((response) => {
      setCourses(response);
      if (response[0]) setSelected(response[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    resourceService.get(`/qr-codes/${selected}`).then(setQrData);
  }, [selected]);

  if (!courses.length) return <Loader label="Chargement des QR codes..." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="QR code par séance" description="Chaque séance possède un QR code unique avec expiration automatique." />
      <div className="glass-card grid gap-6 p-6 lg:grid-cols-[300px_1fr]">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Choisir une séance</label>
          <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {courses.map((course) => <option key={course._id} value={course._id}>{course.title} - {course.date}</option>)}
          </select>
        </div>
        {qrData ? (
          <div className="rounded-3xl bg-slate-50 p-6">
            <img src={qrData.qrImageDataUrl} alt="QR Code" className="mx-auto max-w-xs rounded-3xl bg-white p-4 shadow-soft" />
            <p className="mt-4 text-center text-sm text-slate-500">Expire le {new Date(qrData.expiresAt).toLocaleString("fr-FR")}</p>
            <p className="mt-2 break-all text-center text-xs text-slate-400">{qrData.token}</p>
            <p className="mt-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Lien public du QR</p>
            <p className="mt-2 break-all text-center text-xs text-brand-600">{qrData.qrPayload}</p>
          </div>
        ) : (
          <Loader label="Chargement du QR code..." />
        )}
      </div>
    </div>
  );
};
