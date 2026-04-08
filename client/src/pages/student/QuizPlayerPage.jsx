import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { resourceService } from "../../services/resourceService";

const getErrorMessage = (err) => {
  if (err?.response?.status === 403) {
    return "Vous n’avez pas accès à ce contenu";
  }
  return err?.response?.data?.message || err?.message || "Impossible de charger ce quiz.";
};

export const QuizPlayerPage = () => {
  const { quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setError("");
    setQuiz(null);
    resourceService
      .get(`/quizzes/${quizId}`)
      .then(setQuiz)
      .catch((err) => {
        console.error("Erreur chargement du quiz :", err);
        setError(getErrorMessage(err));
      });
  }, [quizId]);

  const currentQuestion = useMemo(() => quiz?.questions?.[currentQuestionIdx], [currentQuestionIdx, quiz]);

  const handleAnswer = (question, selectedText) => {
    setAnswers((prev) => {
      const current = prev[question._id];

      if (question.type === "multiple") {
        const next = Array.isArray(current) ? [...current] : [];
        const index = next.indexOf(selectedText);
        if (index >= 0) {
          next.splice(index, 1);
        } else {
          next.push(selectedText);
        }

        return {
          ...prev,
          [question._id]: next
        };
      }

      return {
        ...prev,
        [question._id]: selectedText
      };
    });
  };

  const submitQuiz = async () => {
    const payload = Object.entries(answers).map(([questionId, selected]) => ({
      question: questionId,
      selected: Array.isArray(selected) ? selected : [selected]
    }));

    const resultData = await resourceService.post(`/quizzes/${quizId}/submit`, { answers: payload });
    setResult(resultData);
    setSubmitted(true);
  };

  if (error) return <EmptyState title="Accès refusé" description={error} />;
  if (!quiz) return <Loader label="Chargement du quiz..." />;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Evaluation" title={quiz.title} description={quiz.description || "Repondez aux questions et soumettez votre quiz."} />

      {!submitted ? (
        <div className="max-w-3xl rounded-3xl border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-600">
                Question {currentQuestionIdx + 1} / {quiz.questions?.length || 0}
              </p>
              <p className="mt-1 text-sm text-slate-500">{quiz.durationMinutes} min · {quiz.maxScore} points</p>
            </div>
            <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-violet-500 transition-all"
                style={{ width: `${((currentQuestionIdx + 1) / (quiz.questions?.length || 1)) * 100}%` }}
              />
            </div>
          </div>

          {currentQuestion && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">{currentQuestion.text}</h2>

              {currentQuestion.image ? <img src={currentQuestion.image} alt="Question" className="max-h-48 rounded-2xl" /> : null}

              <div className="space-y-2">
                {currentQuestion.options?.map((option, idx) => (
                  <label
                    key={idx}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
                  >
                    <input
                      type={currentQuestion.type === "multiple" ? "checkbox" : "radio"}
                      name={`question-${currentQuestion._id}`}
                      value={option.text}
                      checked={
                        currentQuestion.type === "multiple"
                          ? (answers[currentQuestion._id] || []).includes(option.text)
                          : answers[currentQuestion._id] === option.text
                      }
                      onChange={() => handleAnswer(currentQuestion, option.text)}
                    />
                    <span className="text-sm font-medium text-slate-700">{option.text}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                  disabled={currentQuestionIdx === 0}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  Precedent
                </button>
                {currentQuestionIdx < (quiz.questions?.length || 1) - 1 ? (
                  <button
                    onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                    className="flex-1 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Suivant
                  </button>
                ) : (
                  <button onClick={submitQuiz} className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">
                    Soumettre
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{result?.showScoreAfterSubmission ? "Votre score" : "Soumission enregistree"}</p>
                <p className="mt-2 text-5xl font-bold text-slate-900">{result?.showScoreAfterSubmission ? `${result?.score}/${result?.maxScore}` : "Termine"}</p>
              </div>
              <div className="min-w-[260px]">
                <ProgressBadge rate={result?.showScoreAfterSubmission && result?.maxScore ? (result.score / result.maxScore) * 100 : 0} />
              </div>
            </div>
            {typeof result?.remainingAttempts === "number" ? (
              <p className="mt-4 text-sm text-slate-500">Tentatives restantes: {result.remainingAttempts}</p>
            ) : null}
            {result?.sectionProgress?.isCompleted ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                Félicitations ! Le chapitre "{result.sectionProgress.title}" est désormais terminé.
              </div>
            ) : null}
            <div className="mt-5">
              <Link className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" to="/student/quiz-results">
                Voir tous mes resultats
              </Link>
            </div>
          </div>

          {result?.showAnswersAfterSubmission ? (
            <div className="glass-card p-5">
              <h3 className="mb-4 text-lg font-semibold text-slate-950">Correction</h3>
              <div className="space-y-4">
                {result?.answers?.map((answer, idx) => (
                  <div key={idx} className={`rounded-2xl border p-4 ${answer.correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
                    <p className="font-semibold text-slate-900">{quiz.questions?.find((question) => question._id === answer.question || question._id === answer.question?._id)?.text || quiz.questions?.[idx]?.text}</p>
                    <p className={`mt-2 text-sm ${answer.correct ? "text-emerald-700" : "text-rose-700"}`}>{answer.correct ? "Correct" : "Incorrect"}</p>
                    <p className="mt-2 text-sm text-slate-600">Votre reponse: {(answer.selected || []).join(", ") || "Aucune reponse"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card p-5 text-sm text-slate-600">La correction detaillee sera disponible plus tard.</div>
          )}
        </div>
      )}
    </div>
  );
};
