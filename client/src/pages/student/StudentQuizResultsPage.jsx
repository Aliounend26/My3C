import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/common/EmptyState";
import { Loader } from "../../components/common/Loader";
import { PageHeader } from "../../components/common/PageHeader";
import { ProgressBadge } from "../../components/common/ProgressBadge";
import { resourceService } from "../../services/resourceService";

export const StudentQuizResultsPage = () => {
  const [results, setResults] = useState(null);
  const [quizzes, setQuizzes] = useState(null);

  useEffect(() => {
    Promise.all([resourceService.get("/quizzes/results"), resourceService.get("/quizzes")]).then(([resultsData, quizzesData]) => {
      setResults(resultsData);
      setQuizzes(quizzesData);
    });
  }, []);

  if (!results || !quizzes) return <Loader label="Chargement des resultats de quiz..." />;

  const completedIds = new Set(results.map((result) => result.quiz?._id).filter(Boolean));
  const pendingQuizzes = quizzes.filter((quiz) => !completedIds.has(quiz._id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Evaluations"
        title="Mes quiz et resultats"
        description="Retrouvez vos quiz termines, vos notes obtenues et les quiz encore a faire dans vos cours."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Resultats enregistres</h2>
          {results.length ? (
            <div className="space-y-4">
              {results.map((result) => (
                <article key={result._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{result.quiz?.title || "Quiz"}</p>
                      <p className="mt-1 text-sm text-slate-500">{result.quiz?.description || "Evaluation terminee."}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                      {result.score}/{result.maxScore}
                    </span>
                  </div>
                  <div className="mt-4">
                    <ProgressBadge rate={result.maxScore ? (result.score / result.maxScore) * 100 : 0} />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                    Soumis le {new Date(result.completedAt).toLocaleString("fr-FR")}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Aucun resultat" description="Vos resultats de quiz apparaitront ici apres votre premiere soumission." />
          )}
        </section>

        <section className="glass-card p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-950">Quiz a faire</h2>
          {pendingQuizzes.length ? (
            <div className="space-y-4">
              {pendingQuizzes.map((quiz) => (
                <article key={quiz._id} className="rounded-3xl border border-slate-200 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{quiz.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{quiz.description || "Quiz disponible dans votre cours."}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                      {quiz.course?.title || "Cours"} · {quiz.durationMinutes} min
                    </span>
                    <Link className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white" to={`/student/quizzes/${quiz._id}`}>
                      Commencer
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Tout est termine" description="Aucun quiz en attente pour le moment." />
          )}
        </section>
      </div>
    </div>
  );
};
