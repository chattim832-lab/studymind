"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StudyShell, {
  apiRequest,
} from "../_components/StudyShell";

// CONVERTIR UN SCORE EN POURCENTAGE
function percentage(value) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(value) || 0)
    )
  );
}

// FORMATER UNE DATE
function formattedDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("fr-FR");
}

// BARRE DE PROGRESSION
function ProgressBar({ value }) {
  const score = percentage(value);

  return (
    <div
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 overflow-hidden rounded-full bg-[#EDE1E5]"
    >
      <div
        className="h-full rounded-full bg-[#857C91]"
        style={{
          width: score + "%",
        }}
      />
    </div>
  );
}

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // RECUPERER LES STATISTIQUES
  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        const data = await apiRequest(
          "/study/progress"
        );

        if (active) {
          setProgress(data);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      active = false;
    };
  }, []);

  const history = Array.isArray(
    progress?.history
  )
    ? progress.history
    : [];

  const courses = Array.isArray(
    progress?.courses
  )
    ? progress.courses
    : [];

  const weakPoints = Array.isArray(
    progress?.weak_points
  )
    ? progress.weak_points
    : [];

  const total =
    Number(progress?.total_quizzes) || 0;

  return (
    <StudyShell>
      {/* HEADER */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#CD9FA0]">
            StudyMind · Tes résultats
          </p>

          <h1
            className="mt-2 text-4xl"
            style={{
              fontFamily: "Georgia, serif",
            }}
          >
            Ma progression
          </h1>

          <p className="mt-3 text-sm text-[#857C91]">
            Suis tes scores aux QCM et retrouve
            les notions à revoir.
          </p>
        </div>

        <Link
          href="/revision"
          className="rounded-full bg-[#525871] px-5 py-3 text-sm font-semibold text-white hover:bg-[#857C91]"
        >
          Faire un QCM →
        </Link>
      </header>

      {/* CHARGEMENT */}
      {loading && (
        <p className="rounded-2xl bg-white p-6 text-sm">
          Chargement de la progression...
        </p>
      )}

      {/* ERREUR BACKEND */}
      {!loading && error && (
        <div
          role="alert"
          className="rounded-2xl border border-[#E8DADD] bg-white p-6"
        >
          <p className="font-semibold text-[#A34C59]">
            Impossible de charger la progression
          </p>

          <p className="mt-2 text-sm text-[#857C91]">
            {error}
          </p>

          <p className="mt-2 text-sm text-[#857C91]">
            Le Backend Sprint 3 devra être ajouté
            avant de voir les vrais scores.
          </p>
        </div>
      )}

      {/* RESULTATS */}
      {!loading && !error && progress && (
        <>
          {/* STATISTIQUES PRINCIPALES */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E8DADD] bg-white p-6 shadow-sm">
              <p className="text-sm text-[#857C91]">
                QCM terminés
              </p>

              <p
                className="mt-3 text-4xl"
                style={{
                  fontFamily: "Georgia, serif",
                }}
              >
                {total}
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8DADD] bg-[#F5E3E0] p-6 shadow-sm">
              <p className="text-sm text-[#857C91]">
                Score moyen
              </p>

              <p
                className="mt-3 text-4xl"
                style={{
                  fontFamily: "Georgia, serif",
                }}
              >
                {percentage(
                  progress.average_percentage
                )}{" "}
                %
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8DADD] bg-white p-6 shadow-sm">
              <p className="text-sm text-[#857C91]">
                Meilleur score
              </p>

              <p
                className="mt-3 text-4xl"
                style={{
                  fontFamily: "Georgia, serif",
                }}
              >
                {percentage(
                  progress.best_percentage
                )}{" "}
                %
              </p>
            </div>
          </div>

          {/* AUCUN QCM */}
          {total === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#CD9FA0] bg-white p-9 text-center">
              <h2
                className="text-2xl"
                style={{
                  fontFamily: "Georgia, serif",
                }}
              >
                Aucun QCM terminé
              </h2>

              <p className="mt-3 text-sm text-[#857C91]">
                Termine un premier QCM pour voir
                tes statistiques et les notions
                à réviser.
              </p>

              <Link
                href="/revision"
                className="mt-5 inline-block rounded-full bg-[#525871] px-5 py-3 text-sm font-semibold text-white"
              >
                Commencer maintenant
              </Link>
            </div>
          ) : (
            <>
              {/* RESULTATS PAR COURS */}
              <section className="mb-7 rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm md:p-8">
                <h2
                  className="mb-2 text-2xl"
                  style={{
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Résultats par cours
                </h2>

                <p className="mb-6 text-sm text-[#857C91]">
                  Score moyen obtenu dans chaque matière.
                </p>

                {courses.length === 0 ? (
                  <p className="text-sm text-[#857C91]">
                    Aucune statistique par cours disponible.
                  </p>
                ) : (
                  <div className="space-y-5">
                    {courses.map((course) => (
                      <div
                        key={course.course_id}
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <Link
                            href={
                              "/courses/" +
                              encodeURIComponent(
                                course.course_id
                              )
                            }
                            className="text-sm font-semibold hover:underline"
                          >
                            {course.course_title ||
                              "Cours"}
                          </Link>

                          <span className="text-xs text-[#857C91]">
                            {percentage(
                              course.average_percentage
                            )}{" "}
                            % · {course.attempts} QCM
                          </span>
                        </div>

                        <ProgressBar
                          value={
                            course.average_percentage
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* POINTS A REVISER */}
              <section className="mb-7 rounded-3xl border border-[#E8DADD] bg-[#F5E3E0] p-6 md:p-8">
                <h2
                  className="text-2xl"
                  style={{
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Points à réviser
                </h2>

                <p className="mt-2 text-sm text-[#857C91]">
                  Notions associées aux réponses
                  incorrectes.
                </p>

                {weakPoints.length === 0 ? (
                  <p className="mt-5 text-sm text-[#857C91]">
                    Pas de difficulté identifiée
                    pour le moment.
                  </p>
                ) : (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {weakPoints.map(
                      (point, index) => (
                        <span
                          key={index}
                          className="rounded-full border border-[#E8DADD] bg-white px-4 py-3 text-sm"
                        >
                          {typeof point === "string"
                            ? point
                            : point.topic}

                          {typeof point === "object" &&
                          point?.count
                            ? " (" +
                              point.count +
                              ")"
                            : ""}
                        </span>
                      )
                    )}
                  </div>
                )}
              </section>

              {/* HISTORIQUE DES QCM */}
              <section className="rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm md:p-8">
                <h2
                  className="text-2xl"
                  style={{
                    fontFamily: "Georgia, serif",
                  }}
                >
                  Historique des QCM
                </h2>

                <p className="mb-5 mt-2 text-sm text-[#857C91]">
                  Chaque résultat est enregistré
                  dans ton compte.
                </p>

                {history.length === 0 ? (
                  <p className="text-sm text-[#857C91]">
                    Aucun historique disponible.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map(
                      (attempt, index) => (
                        <div
                          key={
                            attempt.id ||
                            index
                          }
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8DADD] bg-[#FFFCFB] p-4"
                        >
                          <div>
                            <p className="font-semibold">
                              {attempt.course_title ||
                                "Cours"}
                            </p>

                            <p className="mt-1 text-xs text-[#857C91]">
                              {attempt.pdf_filename ||
                                "PDF"}{" "}
                              ·{" "}
                              {formattedDate(
                                attempt.completed_at
                              )}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-semibold">
                              {attempt.score} /{" "}
                              {attempt.total}
                            </p>

                            <p className="text-xs text-[#857C91]">
                              {percentage(
                                attempt.percentage
                              )}{" "}
                              %
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </StudyShell>
  );
}