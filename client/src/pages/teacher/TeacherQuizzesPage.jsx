import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { resourceService } from "../../services/resourceService";

const DRAFT_KEY = "my3c.teacher.quizWizard";
const STEPS = ["Infos", "Pedagogie", "Questions", "Reponses", "Ordre", "Apercu", "Publication"];

const makeQuestion = (type = "single", order = 1) => ({
  text: "",
  type,
  image: "",
  explanation: "",
  score: 1,
  order,
  options: type === "true_false"
    ? [{ text: "Vrai", image: "", isCorrect: true }, { text: "Faux", image: "", isCorrect: false }]
    : [{ text: "", image: "", isCorrect: true }, { text: "", image: "", isCorrect: false }]
});

const makeForm = (course = "") => ({
  title: "",
  description: "",
  course,
  section: "",
  durationMinutes: 20,
  maxAttempts: 1,
  passingScore: 60,
  isRequired: true,
  published: false,
  countsTowardProgress: true,
  requirePassingScoreToCompleteSection: true,
  showScoreAfterSubmission: true,
  showAnswersAfterSubmission: true,
  allowMultipleAttempts: false,
  questions: [makeQuestion()]
});

const totalScore = (questions) => questions.reduce((sum, q) => sum + Number(q.score || 0), 0);

const validateForm = (form, publish = false) => {
  const errors = [];
  if (!form.title.trim()) errors.push("Le titre du quiz est obligatoire.");
  if (!form.course) errors.push("Le cours est obligatoire.");
  if (!form.section) errors.push("La section est obligatoire.");
  if (!form.questions.length) errors.push("Ajoutez au moins une question.");

  form.questions.forEach((question, index) => {
    if (!question.text.trim()) errors.push(`La question ${index + 1} doit avoir un enonce.`);
    if (!question.options.length) errors.push(`La question ${index + 1} doit avoir des reponses.`);
    const filled = question.options.filter((option) => option.text.trim());
    const correct = question.options.filter((option) => option.isCorrect).length;
    if (!filled.length) errors.push(`La question ${index + 1} doit contenir des reponses renseignees.`);
    if (!correct) errors.push(`La question ${index + 1} doit avoir au moins une bonne reponse.`);
    if ((question.type === "single" || question.type === "true_false") && correct !== 1) {
      errors.push(`La question ${index + 1} doit avoir une seule bonne reponse.`);
    }
    if (publish && question.type !== "true_false" && filled.length < 2) {
      errors.push(`La question ${index + 1} doit proposer au moins deux reponses.`);
    }
  });

  return [...new Set(errors)];
};

const toPayload = (form) => ({
  ...form,
  maxScore: totalScore(form.questions),
  questions: form.questions.map((question, index) => ({
    text: question.text.trim(),
    type: question.type,
    image: question.image?.trim() || "",
    explanation: question.explanation?.trim() || "",
    order: index + 1,
    score: Number(question.score || 1),
    options: question.options.map((option) => ({
      text: option.text.trim(),
      image: option.image?.trim() || "",
      isCorrect: Boolean(option.isCorrect)
    }))
  }))
});

const fromQuiz = (quiz) => ({
  _id: quiz._id,
  title: quiz.title || "",
  description: quiz.description || "",
  course: quiz.course?._id || quiz.course || "",
  section: quiz.section?._id || quiz.section || "",
  durationMinutes: quiz.durationMinutes || 20,
  maxAttempts: quiz.maxAttempts || 1,
  passingScore: quiz.passingScore ?? 60,
  isRequired: Boolean(quiz.isRequired),
  published: Boolean(quiz.published),
  countsTowardProgress: quiz.countsTowardProgress !== false,
  requirePassingScoreToCompleteSection: Boolean(quiz.requirePassingScoreToCompleteSection),
  showScoreAfterSubmission: quiz.showScoreAfterSubmission !== false,
  showAnswersAfterSubmission: quiz.showAnswersAfterSubmission !== false,
  allowMultipleAttempts: Boolean(quiz.allowMultipleAttempts),
  questions: (quiz.questions || []).length ? quiz.questions.map((question, index) => ({
    text: question.text || "",
    type: question.type || "single",
    image: question.image || "",
    explanation: question.explanation || "",
    score: Number(question.score || 1),
    order: question.order || index + 1,
    options: (question.options || []).map((option) => ({
      text: option.text || "",
      image: option.image || "",
      isCorrect: Boolean(option.isCorrect)
    }))
  })) : [makeQuestion()]
});

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

export const TeacherQuizzesPage = () => {
  const [quizzes, setQuizzes] = useState(null);
  const [results, setResults] = useState(null);
  const [courses, setCourses] = useState(null);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(makeForm());
  const [step, setStep] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [draftLoaded, setDraftLoaded] = useState(false);

  const load = async () => {
    const [quizzesData, resultsData, coursesData] = await Promise.all([
      resourceService.get("/quizzes"),
      resourceService.get("/quizzes/results"),
      resourceService.get("/courses/groups")
    ]);
    setQuizzes(quizzesData);
    setResults(resultsData);
    setCourses(coursesData);
    setForm((current) => current.course || !coursesData.length ? current : { ...current, course: coursesData[0]._id });
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (!form.course) {
        setSections([]);
        return;
      }

      const data = await resourceService.get(`/sections?course=${form.course}`);
      setSections(data);
      setForm((current) => {
        const validSection = current.section && data.some((item) => item._id === current.section);
        const nextSection = validSection ? current.section : data[0]?._id || "";
        return current.section === nextSection ? current : { ...current, section: nextSection };
      });
    };
    fetchSections();
  }, [form.course]);

  useEffect(() => {
    if (draftLoaded || !courses?.length || editingId) return;
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return setDraftLoaded(true);
    try {
      const parsed = JSON.parse(raw);
      setForm({ ...makeForm(courses[0]._id), ...parsed, course: parsed.course || courses[0]._id });
      setMessage({ type: "info", text: "Un brouillon local a ete recharge." });
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
    setDraftLoaded(true);
  }, [courses, draftLoaded, editingId]);

  useEffect(() => {
    if (!draftLoaded || editingId) return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [draftLoaded, editingId, form]);

  const stats = useMemo(() => {
    if (!quizzes || !results) return { published: 0, drafts: 0, avg: 0 };
    return {
      published: quizzes.filter((quiz) => quiz.published).length,
      drafts: quizzes.filter((quiz) => !quiz.published).length,
      avg: results.length ? Math.round(results.reduce((sum, result) => sum + ((result.score / Math.max(result.maxScore || 1, 1)) * 100), 0) / results.length) : 0
    };
  }, [quizzes, results]);

  const question = form.questions[selectedQuestion] || form.questions[0];
  const errors = validateForm(form, step === 6);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateQuestion = (field, value) => setForm((current) => ({
    ...current,
    questions: current.questions.map((item, index) => index === selectedQuestion ? { ...item, [field]: value, ...(field === "type" ? { options: makeQuestion(value).options } : {}) } : item)
  }));
  const updateOption = (index, field, value) => setForm((current) => ({
    ...current,
    questions: current.questions.map((item, qIndex) => qIndex === selectedQuestion ? { ...item, options: item.options.map((option, oIndex) => oIndex === index ? { ...option, [field]: value } : option) } : item)
  }));
  const markCorrect = (index) => setForm((current) => ({
    ...current,
    questions: current.questions.map((item, qIndex) => qIndex === selectedQuestion ? {
      ...item,
      options: item.options.map((option, oIndex) => item.type === "multiple" ? (oIndex === index ? { ...option, isCorrect: !option.isCorrect } : option) : { ...option, isCorrect: oIndex === index })
    } : item)
  }));

  const addQuestion = () => {
    setForm((current) => ({ ...current, questions: [...current.questions, makeQuestion("single", current.questions.length + 1)] }));
    setSelectedQuestion(form.questions.length);
  };

  const removeQuestion = (index) => {
    if (form.questions.length === 1) return;
    setForm((current) => ({ ...current, questions: current.questions.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 })) }));
    setSelectedQuestion(Math.max(0, index - 1));
  };

  const moveQuestion = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= form.questions.length) return;
    const next = [...form.questions];
    [next[index], next[target]] = [next[target], next[index]];
    setForm((current) => ({ ...current, questions: next.map((item, i) => ({ ...item, order: i + 1 })) }));
    setSelectedQuestion(target);
  };

  const reset = () => {
    setEditingId(null);
    setStep(0);
    setSelectedQuestion(0);
    setMessage({ type: "", text: "" });
    setForm(makeForm(courses?.[0]?._id || ""));
    window.localStorage.removeItem(DRAFT_KEY);
  };

  const saveQuiz = async (publish) => {
    const validation = validateForm(form, publish);
    if (validation.length) {
      setMessage({ type: "error", text: validation[0] });
      setStep(2);
      return;
    }

    setSaving(true);
    try {
      const payload = { ...toPayload(form), published: publish ? true : form.published };
      if (editingId) await resourceService.put(`/quizzes/${editingId}`, payload);
      else await resourceService.post("/quizzes", payload);
      reset();
      await load();
      setMessage({ type: "success", text: publish ? "Le quiz a ete publie." : "Le quiz a ete enregistre." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Impossible d'enregistrer le quiz." });
    } finally {
      setSaving(false);
    }
  };

  if (!quizzes || !results || !courses) return <Loader label="Chargement de l'atelier quiz..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evaluation pedagogique"
        title="Quiz guides"
        description="Créez un quiz par étapes, vérifiez sa logique pédagogique et publiez-le au bon moment."
        actions={
          <>
            <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" onClick={reset}>Nouveau quiz</button>
            <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => saveQuiz(false)} disabled={saving}>Enregistrer</button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5"><p className="text-sm text-slate-500">Publies</p><p className="mt-2 text-3xl font-bold text-slate-950">{stats.published}</p></div>
        <div className="glass-card p-5"><p className="text-sm text-slate-500">Brouillons</p><p className="mt-2 text-3xl font-bold text-slate-950">{stats.drafts}</p></div>
        <div className="glass-card p-5"><p className="text-sm text-slate-500">Reussite moyenne</p><p className="mt-2 text-3xl font-bold text-slate-950">{stats.avg}%</p></div>
      </div>

      {message.text ? <div className={`rounded-2xl border px-4 py-3 text-sm ${message.type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-sky-50 text-sky-700"}`}>{message.text}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <aside className="space-y-6">
          <section className="glass-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Vos quiz</h2>
            <div className="mt-4 space-y-3">
              {quizzes.length ? quizzes.map((quiz) => (
                <article key={quiz._id} className="rounded-3xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{quiz.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{quiz.course?.title || "Cours"} · {quiz.section?.title || "Section"}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{quiz.questions?.length || 0} questions · {quiz.published ? "publie" : "brouillon"}</p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => { setEditingId(quiz._id); setForm(fromQuiz(quiz)); setSelectedQuestion(0); setStep(0); }}>Modifier</button>
                    <button className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700" onClick={async () => { if (window.confirm("Supprimer ce quiz ?")) { await resourceService.delete(`/quizzes/${quiz._id}`); await load(); } }}>Supprimer</button>
                  </div>
                </article>
              )) : <EmptyState title="Aucun quiz" description="Vos quiz apparaitront ici." />}
            </div>
          </section>

          <section className="glass-card p-5">
            <h2 className="text-lg font-semibold text-slate-950">Derniers resultats</h2>
            <div className="mt-4 space-y-3">
              {results.length ? results.slice(0, 6).map((result) => (
                <div key={result._id} className="rounded-3xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{result.student?.firstName} {result.student?.lastName}</p>
                  <p className="mt-1 text-sm text-slate-500">{result.quiz?.title || "Quiz"} · tentative {result.attemptNumber || 1}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-500">{result.score}/{result.maxScore} · {result.passed ? "reussi" : "a retravailler"}</p>
                </div>
              )) : <EmptyState title="Aucun resultat" description="Les soumissions apparaitront ici." />}
            </div>
          </section>
        </aside>

        <section className="glass-card p-6">
          <div className="flex flex-wrap gap-3">{STEPS.map((label, index) => <button key={label} className={`rounded-2xl px-3 py-2 text-sm font-semibold ${index === step ? "bg-slate-950 text-white" : index < step ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`} onClick={() => setStep(index)} type="button">{label}</button>)}</div>

          <div className="mt-6 space-y-5">
            {step === 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Titre du quiz" value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.course} onChange={(event) => updateForm("course", event.target.value)}>
                  <option value="">Sélectionner un cours</option>
                  {courses.map((course) => <option key={course._id} value={course._id}>{course.title}</option>)}
                </select>
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.section} onChange={(event) => updateForm("section", event.target.value)}>
                  <option value="">Sélectionner une section</option>
                  {sections.length ? sections.map((section) => <option key={section._id} value={section._id}>{section.title}</option>) : <option value="">Aucune section disponible</option>}
                </select>
                <input type="number" min="0" className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Durée en minutes" value={form.durationMinutes} onChange={(event) => updateForm("durationMinutes", Number(event.target.value))} />
                <input type="number" min="1" className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Tentatives max" value={form.maxAttempts} disabled={!form.allowMultipleAttempts} onChange={(event) => updateForm("maxAttempts", Number(event.target.value))} />
                <input type="number" min="0" max="100" className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Score minimum (%)" value={form.passingScore} onChange={(event) => updateForm("passingScore", Number(event.target.value))} />
                <textarea className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 lg:col-span-2" placeholder="Description du quiz" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
                <Toggle label="Quiz obligatoire" checked={form.isRequired} onChange={(value) => updateForm("isRequired", value)} />
                <Toggle label="Publier maintenant" checked={form.published} onChange={(value) => updateForm("published", value)} />
              </div>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Toggle label="Compte dans la progression" checked={form.countsTowardProgress} onChange={(value) => updateForm("countsTowardProgress", value)} />
                <Toggle label="Reussite requise pour valider la section" checked={form.requirePassingScoreToCompleteSection} onChange={(value) => updateForm("requirePassingScoreToCompleteSection", value)} />
                <Toggle label="Afficher le score apres soumission" checked={form.showScoreAfterSubmission} onChange={(value) => updateForm("showScoreAfterSubmission", value)} />
                <Toggle label="Afficher les reponses apres soumission" checked={form.showAnswersAfterSubmission} onChange={(value) => updateForm("showAnswersAfterSubmission", value)} />
                <Toggle label="Autoriser plusieurs tentatives" checked={form.allowMultipleAttempts} onChange={(value) => { updateForm("allowMultipleAttempts", value); if (!value) updateForm("maxAttempts", 1); }} />
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-3">
                  {form.questions.map((item, index) => <button key={`${index}-${item.order}`} className={`block w-full rounded-3xl border px-4 py-4 text-left ${index === selectedQuestion ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`} onClick={() => setSelectedQuestion(index)} type="button">Q{index + 1} · {item.text || "Question sans titre"}</button>)}
                  <button className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700" onClick={addQuestion} type="button">Ajouter une question</button>
                </div>
                <div className="space-y-4 rounded-3xl border border-slate-200 p-5">
                  <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={question.type} onChange={(event) => updateQuestion("type", event.target.value)}><option value="single">Choix unique</option><option value="multiple">Choix multiple</option><option value="true_false">Vrai / Faux</option></select>
                  <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enonce" value={question.text} onChange={(event) => updateQuestion("text", event.target.value)} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Image URL" value={question.image} onChange={(event) => updateQuestion("image", event.target.value)} />
                    <input type="number" min="1" className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Points" value={question.score} onChange={(event) => updateQuestion("score", Number(event.target.value))} />
                  </div>
                  <textarea className="min-h-20 w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Explication" value={question.explanation} onChange={(event) => updateQuestion("explanation", event.target.value)} />
                  <div className="flex gap-2">
                    <button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => removeQuestion(selectedQuestion)} type="button">Supprimer</button>
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                {question.options.map((option, index) => (
                  <div key={index} className="grid gap-3 rounded-3xl border border-slate-200 p-4 lg:grid-cols-[1fr_1fr_auto_auto]">
                    <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Texte de reponse" value={option.text} disabled={question.type === "true_false"} onChange={(event) => updateOption(index, "text", event.target.value)} />
                    <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Image URL" value={option.image} onChange={(event) => updateOption(index, "image", event.target.value)} />
                    <button className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700" onClick={() => markCorrect(index)} type="button">{option.isCorrect ? "Correcte" : "Marquer correcte"}</button>
                    {question.type !== "true_false" ? <button className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700" onClick={() => setForm((current) => ({ ...current, questions: current.questions.map((item, qIndex) => qIndex === selectedQuestion ? { ...item, options: item.options.length <= 2 ? item.options : item.options.filter((_, oIndex) => oIndex !== index) } : item) }))} type="button">Supprimer</button> : null}
                  </div>
                ))}
                {question.type !== "true_false" ? <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" onClick={() => setForm((current) => ({ ...current, questions: current.questions.map((item, index) => index === selectedQuestion ? { ...item, options: [...item.options, { text: "", image: "", isCorrect: false }] } : item) }))} type="button">Ajouter une reponse</button> : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-3">
                {form.questions.map((item, index) => <div key={`${item.order}-${index}`} className="flex items-center justify-between rounded-3xl border border-slate-200 p-4"><div><p className="font-semibold text-slate-900">Question {index + 1}</p><p className="text-sm text-slate-500">{item.text || "Question sans titre"}</p></div><div className="flex gap-2"><button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => moveQuestion(index, -1)} type="button">Monter</button><button className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => moveQuestion(index, 1)} type="button">Descendre</button></div></div>)}
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-slate-200 p-5">
                  <p className="text-sm uppercase tracking-[0.16em] text-brand-500">{sections.find((item) => item._id === form.section)?.title || "Section"}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">{form.title || "Quiz sans titre"}</h3>
                  <p className="mt-2 text-sm text-slate-600">{form.description || "Ajoutez une description pour guider les etudiants."}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{form.questions.length} questions · {totalScore(form.questions)} points · {form.durationMinutes} min</p>
                </div>
                {form.questions.map((item, index) => <div key={`${index}-${item.order}`} className="rounded-3xl border border-slate-200 p-5"><p className="font-semibold text-slate-900">Question {index + 1}</p><p className="mt-2 text-sm text-slate-700">{item.text || "Question a completer"}</p><div className="mt-3 space-y-2">{item.options.map((option, optionIndex) => <div key={optionIndex} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">{option.text || "Reponse a completer"} {option.isCorrect ? "· correcte" : ""}</div>)}</div></div>)}
              </div>
            ) : null}

            {step === 6 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 p-5"><p className="text-sm text-slate-500">Cours</p><p className="mt-1 font-semibold text-slate-900">{courses.find((course) => course._id === form.course)?.title || "-"}</p><p className="mt-3 text-sm text-slate-500">Section</p><p className="mt-1 font-semibold text-slate-900">{sections.find((item) => item._id === form.section)?.title || "-"}</p><p className="mt-3 text-sm text-slate-500">Regles</p><p className="mt-1 text-sm text-slate-700">{form.allowMultipleAttempts ? `${form.maxAttempts} tentatives` : "1 tentative"} · score mini {form.passingScore}%</p></div>
                <div className="rounded-3xl border border-slate-200 p-5"><p className="text-sm font-semibold text-slate-900">Checklist</p><div className="mt-3 space-y-2">{errors.length ? errors.map((error) => <p key={error} className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>) : <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Le quiz est pret pour publication.</p>}</div></div>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-slate-200 pt-6">
            <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50" onClick={() => setStep((current) => Math.max(current - 1, 0))} disabled={step === 0} type="button">Precedent</button>
            <div className="flex gap-3">
              <button className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700" onClick={() => saveQuiz(false)} disabled={saving} type="button">Sauvegarder</button>
              {step < STEPS.length - 1 ? <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => { if (step === 0 && (!form.title.trim() || !form.course || !form.section)) { setMessage({ type: "error", text: "Completez les informations generales avant de continuer." }); return; } if (step >= 2 && validateForm(form).length) { setMessage({ type: "error", text: validateForm(form)[0] }); return; } setMessage({ type: "", text: "" }); setStep((current) => Math.min(current + 1, STEPS.length - 1)); }} type="button">Suivant</button> : <button className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white" onClick={() => saveQuiz(true)} disabled={saving} type="button">Publier</button>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
