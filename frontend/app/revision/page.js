"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StudyShell, {
  apiRequest,
  getId,
} from "../_components/StudyShell";

const MODES = [
  {
    key: "summary",
    label: "Résumé automatique",
  },
  {
    key: "sheet",
    label: "Fiche de révision",
  },
  {
    key: "quiz",
    label: "Quiz QCM",
  },
];

// AFFICHAGE DES SOURCES PDF
function SourceList({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 border-t border-[#E8DADD] pt-4">
      <p className="mb-2 text-sm font-semibold">
        Pages sources
      </p>

      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <span
            key={index}
            className="rounded-full bg-[#F5E3E0] px-3 py-2 text-xs text-[#525871]"
          >
            {source.filename || "PDF"} — page {source.page}
          </span>
        ))}
      </div>
    </div>
  );
}

// AFFICHAGE DU TEXTE GENERE
function ResultText({ value }) {
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-8 text-[#525871]">
      {value}
    </div>
  );
}

export default function RevisionPage() {
  const initialPdf = useRef("");

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  const [pdfs, setPdfs] = useState([]);
  const [pdfId, setPdfId] = useState("");

  const [tab, setTab] = useState("summary");
  const [language, setLanguage] = useState("fr");

  const [summary, setSummary] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [quiz, setQuiz] = useState(null);

  const [answers, setAnswers] = useState({});
  const [report, setReport] = useState(null);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  // EFFACER LES ANCIENS RESULTATS
  function clearResults() {
    setSummary(null);
    setSheet(null);
    setQuiz(null);
    setAnswers({});
    setReport(null);
    setError("");
  }

  // CHARGER LES COURS
  useEffect(() => {
    let active = true;

    async function loadCourses() {
      try {
        const data = await apiRequest("/courses");

        if (!active) return;

        const list = Array.isArray(data)
          ? data
          : data.courses || [];

        setCourses(list);

        const params = new URLSearchParams(
          window.location.search
        );

        const wantedCourse =
          params.get("course_id") || "";

        const wantedTab =
          params.get("tab") || "summary";

        initialPdf.current =
          params.get("pdf_id") || "";

        if (
          MODES.some((mode) => mode.key === wantedTab)
        ) {
          setTab(wantedTab);
        }

        if (list.length > 0) {
          const selected = list.find(
            (item) => getId(item) === wantedCourse
          );

          setCourseId(
            selected
              ? getId(selected)
              : getId(list[0])
          );
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoadingCourses(false);
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, []);

  // CHARGER LES PDF DU COURS
  useEffect(() => {
    if (!courseId) return;

    let active = true;

    async function loadPdfs() {
      setLoadingPdfs(true);
      setError("");

      try {
        const data = await apiRequest(
          "/courses/" +
            encodeURIComponent(courseId) +
            "/pdfs"
        );

        if (!active) return;

        const list = Array.isArray(data)
          ? data
          : data.pdfs || [];

        setPdfs(list);

        const match = list.find(
          (item) =>
            getId(item) === initialPdf.current
        );

        setPdfId(
          match
            ? getId(match)
            : list.length
            ? getId(list[0])
            : ""
        );

        initialPdf.current = "";
      } catch (err) {
        if (active) {
          setPdfs([]);
          setPdfId("");
          setError(err.message);
        }
      } finally {
        if (active) setLoadingPdfs(false);
      }
    }

    loadPdfs();

    return () => {
      active = false;
    };
  }, [courseId]);

  // CHANGER DE COURS
  function changeCourse(value) {
    initialPdf.current = "";
    clearResults();
    setCourseId(value);
    setPdfId("");
    setPdfs([]);
  }

  // CHANGER DE PDF
  function changePdf(value) {
    clearResults();
    setPdfId(value);
  }

  // CHANGER DE LANGUE
  function changeLanguage(value) {
    clearResults();
    setLanguage(value);
  }

  // GENERER RESUME, FICHE OU QCM
  async function generate() {
    if (!courseId || !pdfId) {
      setError(
        "Choisis un cours qui contient au moins un PDF."
      );
      return;
    }

    const endpoints = {
      summary: "/study/summary",
      sheet: "/study/revision-sheet",
      quiz: "/study/quiz",
    };

    setBusy("generate");
    setError("");

    try {
      const data = await apiRequest(
        endpoints[tab],
        {
          method: "POST",
          body: {
            course_id: courseId,
            pdf_id: pdfId,
            language,
            ...(tab === "quiz"
              ? { question_count: 5 }
              : {}),
          },
        }
      );

      if (tab === "summary") {
        if (typeof data.summary !== "string") {
          throw new Error(
            "Réponse de résumé invalide."
          );
        }

        setSummary(data);
      } else if (tab === "sheet") {
        if (typeof data.sheet !== "string") {
          throw new Error(
            "Réponse de fiche invalide."
          );
        }

        setSheet(data);
      } else {
        if (
          !data.quiz_id ||
          !Array.isArray(data.questions) ||
          data.questions.length === 0
        ) {
          throw new Error(
            "Le Backend n'a pas retourné de QCM valide."
          );
        }

        setQuiz(data);
        setAnswers({});
        setReport(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  // ENVOYER LES REPONSES DU QCM
  async function submitQuiz() {
    if (!quiz || busy) return;

    const questions = quiz.questions;

    const missingAnswer = questions.some(
      (question) =>
        !answers[String(question.id)]
    );

    if (missingAnswer) {
      setError(
        "Réponds à toutes les questions avant de corriger le QCM."
      );
      return;
    }

    setBusy("submit");
    setError("");

    try {
      const data = await apiRequest(
        "/study/quiz/submit",
        {
          method: "POST",
          body: {
            quiz_id: quiz.quiz_id,
            answers: questions.map(
              (question) => ({
                question_id: String(question.id),
                option_id: String(
                  answers[String(question.id)]
                ),
              })
            ),
          },
        }
      );

      if (
        typeof data.score !== "number" ||
        typeof data.total !== "number"
      ) {
        throw new Error(
          "Réponse de correction invalide."
        );
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const selectedCourse = courses.find(
    (item) => getId(item) === courseId
  );

  const selectedPdf = pdfs.find(
    (item) => getId(item) === pdfId
  );

  const hasPdf = Boolean(
    courseId && pdfId && !loadingPdfs
  );

  return (
    <StudyShell>
      {/* HEADER */}
      <header className="mb-7">
        <p className="text-xs uppercase tracking-widest text-[#CD9FA0]">
          Sprint 3 · StudyMind IA
        </p>

        <h1
          className="mt-2 text-4xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Mon espace de révision
        </h1>

        <p className="mt-3 text-sm text-[#857C91]">
          Transforme un PDF en résumé,
          fiche de révision ou QCM avec explications.
        </p>
      </header>

      {/* CHOIX DU DOCUMENT */}
      <section className="mb-7 rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm">
        <h2
          className="mb-5 text-xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Choisir le document
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {/* COURS */}
          <label className="block text-sm font-medium">
            Cours

            <select
              value={courseId}
              onChange={(event) =>
                changeCourse(event.target.value)
              }
              disabled={
                loadingCourses || busy !== ""
              }
              className="mt-2 w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] p-3 outline-[#857C91]"
            >
              {courses.length === 0 && (
                <option value="">
                  Aucun cours
                </option>
              )}

              {courses.map((course) => (
                <option
                  key={getId(course)}
                  value={getId(course)}
                >
                  {course.title || course.name}
                </option>
              ))}
            </select>
          </label>

          {/* PDF */}
          <label className="block text-sm font-medium">
            Document PDF

            <select
              value={pdfId}
              onChange={(event) =>
                changePdf(event.target.value)
              }
              disabled={
                !courseId ||
                loadingPdfs ||
                busy !== ""
              }
              className="mt-2 w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] p-3 outline-[#857C91]"
            >
              {pdfs.length === 0 && (
                <option value="">
                  Aucun document
                </option>
              )}

              {pdfs.map((pdf) => (
                <option
                  key={getId(pdf)}
                  value={getId(pdf)}
                >
                  {pdf.filename}
                </option>
              ))}
            </select>
          </label>

          {/* LANGUE */}
          <label className="block text-sm font-medium">
            Langue de génération

            <select
              value={language}
              onChange={(event) =>
                changeLanguage(event.target.value)
              }
              disabled={busy !== ""}
              className="mt-2 w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] p-3 outline-[#857C91]"
            >
              <option value="fr">
                Français
              </option>
              <option value="en">
                English
              </option>
            </select>
          </label>
        </div>

        {!loadingPdfs &&
          courseId &&
          pdfs.length === 0 && (
            <p className="mt-4 text-sm text-[#A34C59]">
              Ajoute d&apos;abord un PDF dans ce cours
              pour utiliser les outils de révision.
            </p>
          )}

        {selectedCourse && selectedPdf && (
          <p className="mt-4 text-xs text-[#857C91]">
            Document choisi :{" "}
            {selectedCourse.title ||
              selectedCourse.name}{" "}
            / {selectedPdf.filename}
          </p>
        )}
      </section>

      {/* ONGLETS */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            aria-pressed={tab === mode.key}
            onClick={() => {
              setTab(mode.key);
              setError("");
            }}
            disabled={busy !== ""}
            className={
              "rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition disabled:opacity-60 " +
              (tab === mode.key
                ? "border-[#857C91] bg-[#E6D4D9] text-[#525871] shadow-sm"
                : "border-[#E8DADD] bg-white text-[#857C91] hover:bg-[#FAF1EE]")
            }
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* GENERATION */}
      <section className="rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="text-2xl"
              style={{
                fontFamily: "Georgia, serif",
              }}
            >
              {
                MODES.find(
                  (mode) => mode.key === tab
                )?.label
              }
            </h2>

            <p className="mt-2 text-sm text-[#857C91]">
              {tab === "quiz"
                ? "5 questions à choix multiple, avec correction expliquée."
                : "Génération à partir du PDF sélectionné."}
            </p>
          </div>

          <button
            type="button"
            disabled={!hasPdf || busy !== ""}
            onClick={generate}
            className="rounded-full bg-[#525871] px-6 py-3 text-sm font-semibold text-white hover:bg-[#857C91] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "generate"
              ? "Génération en cours..."
              : tab === "quiz"
              ? "Générer un QCM"
              : tab === "sheet"
              ? "Générer la fiche"
              : "Générer le résumé"}
          </button>
        </div>

        {/* ERREURS */}
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-xl bg-[#F7E2E2] p-4 text-sm text-[#8A3F48]"
          >
            {error}
          </p>
        )}

        {/* RESULTAT RESUME */}
        {tab === "summary" &&
          (summary ? (
            <div className="rounded-2xl bg-[#FAF6F4] p-5">
              <ResultText
                value={summary.summary}
              />
              <SourceList
                sources={summary.sources}
              />
            </div>
          ) : (
            <p className="rounded-2xl bg-[#FAF6F4] p-6 text-sm text-[#857C91]">
              Clique sur « Générer le résumé »
              pour commencer.
            </p>
          ))}

        {/* RESULTAT FICHE */}
        {tab === "sheet" &&
          (sheet ? (
            <div className="rounded-2xl bg-[#FAF6F4] p-5">
              <ResultText value={sheet.sheet} />
              <SourceList
                sources={sheet.sources}
              />
            </div>
          ) : (
            <p className="rounded-2xl bg-[#FAF6F4] p-6 text-sm text-[#857C91]">
              Clique sur « Générer la fiche »
              pour commencer.
            </p>
          ))}

        {/* INTRODUCTION QCM */}
        {tab === "quiz" && !quiz && (
          <p className="rounded-2xl bg-[#FAF6F4] p-6 text-sm text-[#857C91]">
            Clique sur « Générer un QCM ».
            Tu répondras ensuite aux questions
            avant de voir les bonnes réponses.
          </p>
        )}

        {/* QUESTIONS QCM */}
        {tab === "quiz" && quiz && (
          <div className="space-y-5">
            {quiz.questions.map(
              (question, index) => {
                const qid = String(
                  question.id
                );

                const correction =
                  report?.corrections?.find(
                    (item) =>
                      String(
                        item.question_id
                      ) === qid
                  );

                const options =
                  Array.isArray(
                    question.options
                  )
                    ? question.options
                    : [];

                const correctOption =
                  options.find(
                    (option) =>
                      String(
                        option.id
                      ) ===
                      String(
                        correction?.correct_option_id
                      )
                  );

                const isCorrect =
                  correction &&
                  String(
                    correction.selected_option_id
                  ) ===
                    String(
                      correction.correct_option_id
                    );

                return (
                  <div
                    key={qid}
                    className="rounded-2xl border border-[#E8DADD] bg-[#FFFCFB] p-5"
                  >
                    {/* QUESTION */}
                    <p className="mb-4 font-semibold">
                      {index + 1}.{" "}
                      {question.question}
                    </p>

                    {/* CHOIX */}
                    <div className="space-y-2">
                      {options.map(
                        (option) => (
                          <label
                            key={String(
                              option.id
                            )}
                            className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#FAF6F4] p-3 text-sm"
                          >
                            <input
                              type="radio"
                              name={
                                "question-" +
                                qid
                              }
                              value={String(
                                option.id
                              )}
                              checked={
                                answers[
                                  qid
                                ] ===
                                String(
                                  option.id
                                )
                              }
                              disabled={
                                Boolean(
                                  report
                                ) ||
                                busy !==
                                  ""
                              }
                              onChange={() => {
                                setAnswers(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    [qid]:
                                      String(
                                        option.id
                                      ),
                                  })
                                );
                                setError(
                                  ""
                                );
                              }}
                              className="mt-1 accent-[#857C91]"
                            />

                            <span>
                              {
                                option.text
                              }
                            </span>
                          </label>
                        )
                      )}
                    </div>

                    {/* CORRECTION */}
                    {correction && (
                      <div className="mt-4 rounded-xl bg-[#F1E9E7] p-4 text-sm leading-6">
                        <p className="font-semibold">
                          {isCorrect
                            ? "✓ Bonne réponse"
                            : "✗ Réponse incorrecte"}
                        </p>

                        <p className="mt-1">
                          Bonne réponse :{" "}
                          {correctOption?.text ||
                            correction.correct_option_id}
                        </p>

                        {correction.explanation && (
                          <p className="mt-2">
                            Explication :{" "}
                            {
                              correction.explanation
                            }
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}

            {/* TERMINER LE QUIZ */}
            {!report ? (
              <button
                type="button"
                onClick={submitQuiz}
                disabled={busy !== ""}
                className="rounded-full bg-[#525871] px-6 py-3 text-sm font-semibold text-white hover:bg-[#857C91] disabled:opacity-50"
              >
                {busy === "submit"
                  ? "Correction en cours..."
                  : "Terminer et corriger le QCM"}
              </button>
            ) : (
              /* RESULTAT FINAL */
              <div className="rounded-2xl border border-[#E8DADD] bg-[#F5E3E0] p-6">
                <p className="text-sm text-[#857C91]">
                  Ton résultat
                </p>

                <p
                  className="mt-2 text-4xl"
                  style={{
                    fontFamily:
                      "Georgia, serif",
                  }}
                >
                  {report.score} /{" "}
                  {report.total} —{" "}
                  {Math.round(
                    report.percentage || 0
                  )}{" "}
                  %
                </p>

                <p className="mt-2 text-sm">
                  Les corrections et explications
                  apparaissent sous chaque question.
                </p>

                <Link
                  href="/progress"
                  className="mt-4 inline-block rounded-full bg-[#525871] px-5 py-3 text-sm font-semibold text-white"
                >
                  Voir ma progression →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
    </StudyShell>
  );
}