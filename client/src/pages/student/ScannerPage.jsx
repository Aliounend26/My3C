import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Keyboard, QrCode, ScanLine } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";

const parseQrText = (value) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    const courseId = url.searchParams.get("courseId");
    const token = url.searchParams.get("token");

    if (courseId && token) {
      return { courseId, token };
    }
  } catch {
    const courseIdMatch = value.match(/courseId=([^&\s]+)/i);
    const tokenMatch = value.match(/token=([^&\s]+)/i);

    if (courseIdMatch && tokenMatch) {
      return {
        courseId: decodeURIComponent(courseIdMatch[1]),
        token: decodeURIComponent(tokenMatch[1])
      };
    }
  }

  return null;
};

export const ScannerPage = () => {
  const [searchParams] = useSearchParams();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const scanningLockRef = useRef(false);

  const [manualCode, setManualCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [lastAttendance, setLastAttendance] = useState(null);
  const [courses, setCourses] = useState([]);

  const focusedCourseId = searchParams.get("courseId") || "";

  const refreshSummary = async () => {
    try {
      const summary = await resourceService.get("/attendances/me");
      setAttendanceSummary(summary);
    } catch (requestError) {
      console.error(requestError);
    }
  };

  useEffect(() => {
    refreshSummary();
    resourceService
      .get("/courses/groups")
      .then(setCourses)
      .catch((requestError) => console.error(requestError));
  }, []);

  useEffect(
    () => () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    },
    []
  );

  const focusedCourse = useMemo(
    () => courses.find((course) => course._id === focusedCourseId) || null,
    [courses, focusedCourseId]
  );

  const submitScan = async (payload) => {
    if (scanningLockRef.current) return;

    scanningLockRef.current = true;
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const parsedPayload = parseQrText(payload.rawValue || "");
      if (focusedCourseId && parsedPayload?.courseId) {
        const sessionData = await resourceService.get(
          `/qr-codes/public/session?courseId=${encodeURIComponent(parsedPayload.courseId)}&token=${encodeURIComponent(parsedPayload.token)}`
        );

        if (sessionData?.course?.courseGroupId !== focusedCourseId) {
          setError("Ce QR code n'appartient pas au cours selectionne.");
          return;
        }
      }

      const attendance = await resourceService.post("/attendances/scan", payload);
      setLastAttendance(attendance);
      setMessage(
        `Presence enregistree avec succes pour "${attendance.course?.title || "le cours"}" le ${attendance.course?.date || ""} a ${new Date(
          attendance.scannedAt
        ).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`
      );
      setManualCode("");
      await refreshSummary();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Impossible d'enregistrer la presence.");
    } finally {
      scanningLockRef.current = false;
      setSubmitting(false);
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = async () => {
    if (!videoRef.current || !detectorRef.current || scanningLockRef.current) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      const qrMatch = barcodes.find((item) => item.rawValue && parseQrText(item.rawValue));

      if (qrMatch?.rawValue) {
        stopCamera();
        await submitScan({ rawValue: qrMatch.rawValue });
        return;
      }
    } catch (scanError) {
      console.error(scanError);
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setError("");
    setMessage("");
    setCameraPermissionError("");

    if (!("BarcodeDetector" in window)) {
      setCameraSupported(false);
      return;
    }

    try {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      detectorRef.current = detector;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setCameraSupported(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (cameraError) {
      console.error(cameraError);
      setCameraPermissionError("Impossible d'acceder a la camera. Vous pouvez utiliser la saisie manuelle ci-dessous.");
      setCameraActive(false);
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    await submitScan({ rawValue: manualCode });
  };

  const topCourses = useMemo(() => attendanceSummary?.byCourse?.slice(0, 4) || [], [attendanceSummary]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Presence"
        title="Scanner un QR code"
        description={
          focusedCourse
            ? `Scannez le QR code du cours "${focusedCourse.title}" pour enregistrer votre presence.`
            : "Scannez le QR code affiche en classe ou collez son contenu pour enregistrer votre presence."
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card space-y-5 p-6">
          {focusedCourse ? (
            <div className="rounded-[28px] border border-brand-200 bg-brand-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-600">Cours cible</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">{focusedCourse.title}</h3>
              <p className="mt-2 text-sm text-slate-600">Formation: {focusedCourse.formation?.name || "-"} · Utilisez le QR code affiche pour ce cours.</p>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Scanner QR</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Zone de scan camera</h3>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              onClick={cameraActive ? stopCamera : startCamera}
              type="button"
            >
              <Camera className="h-4 w-4" />
              {cameraActive ? "Arreter la camera" : "Lancer la camera"}
            </button>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950/95">
            <div className="aspect-[4/3] w-full">
              {cameraActive ? (
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white/80">
                  <div className="rounded-full bg-white/10 p-4">
                    <ScanLine className="h-8 w-8" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-white">Pointez la camera vers le QR code du cours</p>
                    <p className="text-sm text-white/70">Le scan detecte automatiquement le lien securise et enregistre votre presence.</p>
                  </div>
                </div>
              )}
            </div>
            {cameraActive ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-56 w-56 rounded-[32px] border-2 border-white/90 shadow-[0_0_0_999px_rgba(15,23,42,0.18)]" />
              </div>
            ) : null}
          </div>

          {!cameraSupported ? (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Votre navigateur ne supporte pas le scan QR natif. Utilisez la saisie manuelle juste en dessous.
            </div>
          ) : null}
          {cameraPermissionError ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{cameraPermissionError}</div> : null}

          <form className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5" onSubmit={handleManualSubmit}>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              <Keyboard className="h-4 w-4" />
              Entrer un code manuellement
            </div>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-500"
              placeholder="Collez ici le lien QR ou un texte contenant token=... et courseId=..."
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
            />
            <button
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!manualCode.trim() || submitting}
            >
              <QrCode className="h-4 w-4" />
              Valider ce code
            </button>
          </form>

          {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
          {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

          {lastAttendance ? (
            <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Dernier pointage</p>
              <div className="mt-3 space-y-2 text-sm text-emerald-900">
                <p><span className="font-semibold">Cours :</span> {lastAttendance.course?.title || "-"}</p>
                <p><span className="font-semibold">Date :</span> {lastAttendance.course?.date || "-"}</p>
                <p><span className="font-semibold">Heure :</span> {new Date(lastAttendance.scannedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                <p><span className="font-semibold">Statut :</span> {lastAttendance.status === "late" ? "Retard" : "Present"}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Resume</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Mes presences</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Taux global</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{Number(attendanceSummary?.rate || 0).toFixed(1)}%</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Pointages valides</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{attendanceSummary?.attendanceCount || 0}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Heures presentes</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{Number(attendanceSummary?.presentHours || 0).toFixed(1)} h</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Heures prevues</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">{Number(attendanceSummary?.totalHours || 0).toFixed(1)} h</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-brand-500">Par cours</p>
            <div className="mt-4 space-y-3">
              {topCourses.length ? (
                topCourses.map((course) => (
                  <div key={course.courseId} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-950">{course.courseTitle}</p>
                        <p className="mt-1 text-sm text-slate-500">{course.formationName}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{course.rate.toFixed(1)}%</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${course.rate >= 90 ? "bg-emerald-500" : course.rate >= 75 ? "bg-amber-400" : course.rate >= 50 ? "bg-orange-400" : "bg-rose-500"}`}
                        style={{ width: `${Math.min(course.rate, 100)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {course.attendanceCount} pointage(s) · {Number(course.presentHours || 0).toFixed(1)} h comptabilisee(s)
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Aucune presence enregistree pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
