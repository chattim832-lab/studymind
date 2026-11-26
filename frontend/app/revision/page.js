"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StudyShell, { apiRequest, getId } from "../_components/StudyShell";

const MODES = [
  { key: "summary", label: "Résumé automatique", short: "Résumé" },
  { key: "sheet", label: "Fiche de révision", short: "Fiche" },
  { key: "quiz", label: "Quiz QCM", short: "QCM" },
];

function SourceList({ sources }) {
  if (!Array.isArray(sources) || sources.length === 0) return null;
  return (
    <div className="mt-5 border-t border-[#DCE8E6] pt-4">
      <p className="mb-2 text-sm font-semibold">Pages sources</p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <span key={index} className="rounded-full bg-[#D6E9ED] px-3 py-2 text-xs text-[#684F48]">
            {source.filename || "PDF"} — page {source.page}
          </span>
        ))}
      </div>
    </div>
  );
}

function ResultText({ value }) {
  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-8 text-[#684F48]">
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

  function clearResults() {
    setSummary(null);
    setSheet(null);
    setQuiz(null);
    setAnswers({});
    setReport(null);
    setError("");
  }

  // 1. Charger les cours et lire la sélection envoyée par la page du cours.
  useEffect(() => {
    let active = true;
    async function loadCourses() {
      try {
        const data = await apiRequest("/courses");
        if (!active) return;
        const list = Array.isArray(data) ? data : data.courses || [];
        setCourses(list);

        const params = new URLSearchParams(window.location.search);
        const wantedCourse = params.get("course_id") || "";
        const wantedTab = params.get("tab") || "summary";
        initialPdf.current = params.get("pdf_id") || "";
        if (MODES.some((mode) => mode.key === wantedTab)) setTab(wantedTab);
        if (list.length > 0) {
          const selected = list.find((item) => getId(item) === wantedCourse);
          setCourseId(selected ? getId(selected) : getId(list[0]));
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoadingCourses(false);
      }
    }
    loadCourses();
    return () => { active = false; };
  }, []);

  // 2. Récupérer les PDF du cours sélectionné.
  useEffect(() => {
    if (!courseId) {
      setPdfs([]);
      setPdfId("");
      return;
    }
    let active = true;
    async function loadPdfs() {
      setLoadingPdfs(true);
      setError("");
      try {
        const data = await apiRequest("/courses/" + encodeURIComponent(courseId) + "/pdfs");
        if (!active) return;
        const list = Array.isArray(data) ? data : data.pdfs || [];
        setPdfs(list);
        const match = list.find((item) => getId(item) === initialPdf.current);
        setPdfId(match ? getId(match) : list.length ? getId(list[0]) : "");
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
    return () => { active = false; };
  }, [courseId]);

  function changeCourse(value) {
    initialPdf.current = "";
    clearResults();
    setCourseId(value);
    setPdfId("");
    setPdfs([]);
  }

  function changePdf(value) {
    clearResults();
    setPdfId(value);
  }

  function changeLanguage(value) {
    clearResults();
    setLanguage(value);
  }

  // 3. Appeler Gemini via FastAPI pour générer le contenu demandé.
  async function generate() {
    if (!courseId || !pdfId) {
      setError("Choisis un cours qui contient au moins un PDF.");
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
      const data = await apiRequest(endpoints[tab], {
        method: "POST",
        body: {
          course_id: courseId,
          pdf_id: pdfId,
          language,
          ...(tab === "quiz" ? { question_count: 5 } : {}),
        },
      });

      if (tab === "summary") {
        if (typeof data.summary !== "string") throw new Error("Réponse de résumé invalide.");
        setSummary(data);
      } else if (tab === "sheet") {
        if (typeof data.sheet !== "string") throw new Error("Réponse de fiche invalide.");
        setSheet(data);
      } else {
        if (!data.quiz_id || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error("Le Backend n'a pas retourné de QCM valide.");
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

  // 4. Envoyer les réponses pour une correction sécurisée côté Backend.
  async function submitQuiz() {
    if (!quiz || busy) return;
    const questions = quiz.questions;
    const missingAnswer = questions.some((question) => !answers[String(question.id)]);
    if (missingAnswer) {
      setError("Réponds à toutes les questions avant de corriger le QCM.");
      return;
    }

    setBusy("submit");
    setError("");
    try {
      const data = await apiRequest("/study/quiz/submit", {
        method: "POST",
        body: {
          quiz_id: quiz.quiz_id,
          answers: questions.map((question) => ({
            question_id: String(question.id),
            option_id: String(answers[String(question.id)]),
          })),
        },
      });
      if (typeof data.score !== "number" || typeof data.total !== "number") {
        throw new Error("Réponse de correction invalide.");
      }
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  const selectedCourse = courses.find((item) => getId(item) === courseId);
  const selectedPdf = pdfs.find((item) => getId(item) === pdfId);
  const hasPdf = Boolean(courseId && pdfId && !loadingPdfs);

  return (
    <StudyShell>
      <header className="mb-7">
        
        <h1 className="mt-2 text-4xl" style={{ fontFamily: "Georgia, serif" }}>Mon espace de révision</h1>
        <p className="mt-3 text-sm text-[#806F68]">
          Transforme un PDF en résumé, fiche de révision ou QCM avec explications.
        </p>
      </header>

      <section className="mb-7 rounded-3xl border border-[#DCE8E6] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl" style={{ fontFamily: "Georgia, serif" }}>Choisir le document</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm font-medium">
            Cours
            <select
              value={courseId}
              onChange={(event) => changeCourse(event.target.value)}
              disabled={loadingCourses || busy !== ""}
              className="mt-2 w-full rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 outline-[#806F68]"
            >
              {courses.length === 0 && <option value="">Aucun cours</option>}
              {courses.map((course) => <option key={getId(course)} value={getId(course)}>{course.title}</option>)}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Document PDF
            <select
              value={pdfId}
              onChange={(event) => changePdf(event.target.value)}
              disabled={!courseId || loadingPdfs || busy !== ""}
              className="mt-2 w-full rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 outline-[#806F68]"
            >
              {pdfs.length === 0 && <option value="">Aucun document</option>}
              {pdfs.map((pdf) => <option key={getId(pdf)} value={getId(pdf)}>{pdf.filename}</option>)}
            </select>
          </label>

          <label className="block text-sm font-medium">
            Langue de génération
            <select
              value={language}
              onChange={(event) => changeLanguage(event.target.value)}
              disabled={busy !== ""}
              className="mt-2 w-full rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 outline-[#806F68]"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
        {!loadingPdfs && courseId && pdfs.length === 0 && (
          <p className="mt-4 text-sm text-[#855C57]">
            Ajoute d'abord un PDF dans ce cours pour utiliser les outils de révision.
          </p>
        )}
        {selectedCourse && selectedPdf && (
          <p className="mt-4 text-xs text-[#806F68]">
            Document choisi : {selectedCourse.title} / {selectedPdf.filename}
          </p>
        )}
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            aria-pressed={tab === mode.key}
            onClick={() => { setTab(mode.key); setError(""); }}
            disabled={busy !== ""}
            className={
              "rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition disabled:opacity-60 " +
              (tab === mode.key
                ? "border-[#806F68] bg-[#D6E9ED] text-[#684F48] shadow-sm"
                : "border-[#DCE8E6] bg-white text-[#806F68] hover:bg-[#FAF1EE]")
            }
          >
            {mode.label}
          </button>
        ))}
      </div>

      <section className="rounded-3xl border border-[#DCE8E6] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl" style={{ fontFamily: "Georgia, serif" }}>
              {MODES.find((mode) => mode.key === tab)?.label}
            </h2>
            <p className="mt-2 text-sm text-[#806F68]">
              {tab === "quiz" ? "5 questions à choix multiple, avec correction expliquée." : "Génération à partir du PDF sélectionné."}
            </p>
          </div>
          <button
            type="button"
            disabled={!hasPdf || busy !== ""}
            onClick={generate}
            className="rounded-full bg-[#684F48] px-6 py-3 text-sm font-semibold text-white hover:bg-[#806F68] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "generate" ? "Génération en cours..." : tab === "quiz" ? "Générer un QCM" : "Générer " + (tab === "sheet" ? "la fiche" : "le résumé")}
          </button>
        </div>

        {error && <p role="alert" className="mb-6 rounded-xl bg-[#F9E7C7] p-4 text-sm text-[#684F48]">{error}</p>}

        {tab === "summary" && (
          summary ? (
            <div className="rounded-2xl bg-[#FFFDF8] p-5">
              <ResultText value={summary.summary} />
              <SourceList sources={summary.sources} />
            </div>
          ) : <p className="rounded-2xl bg-[#FFFDF8] p-6 text-sm text-[#806F68]">Clique sur « Générer le résumé » pour commencer.</p>
        )}

        {tab === "sheet" && (
          sheet ? (
            <div className="rounded-2xl bg-[#FFFDF8] p-5">
              <ResultText value={sheet.sheet} />
              <SourceList sources={sheet.sources} />
            </div>
          ) : <p className="rounded-2xl bg-[#FFFDF8] p-6 text-sm text-[#806F68]">Clique sur « Générer la fiche » pour commencer.</p>
        )}

        {tab === "quiz" && !quiz && (
          <p className="rounded-2xl bg-[#FFFDF8] p-6 text-sm text-[#806F68]">
            Clique sur « Générer un QCM ». Tu répondras ensuite aux questions avant de voir les bonnes réponses.
          </p>
        )}

        {tab === "quiz" && quiz && (
          <div className="space-y-5">
            {quiz.questions.map((question, index) => {
              const qid = String(question.id);
              const correction = report?.corrections?.find((item) => String(item.question_id) === qid);
              const options = Array.isArray(question.options) ? question.options : [];
              const correctOption = options.find((option) => String(option.id) === String(correction?.correct_option_id));
              const isCorrect = correction && String(correction.selected_option_id) === String(correction.correct_option_id);
              return (
                <div key={qid} className="rounded-2xl border border-[#DCE8E6] bg-[#FFFDF8] p-5">
                  <p className="mb-4 font-semibold">{index + 1}. {question.question}</p>
                  <div className="space-y-2">
                    {options.map((option) => (
                      <label key={String(option.id)} className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#FFFDF8] p-3 text-sm">
                        <input
                          type="radio"
                          name={"question-" + qid}
                          value={String(option.id)}
                          checked={answers[qid] === String(option.id)}
                          disabled={Boolean(report) || busy !== ""}
                          onChange={() => { setAnswers((previous) => ({ ...previous, [qid]: String(option.id) })); setError(""); }}
                          className="mt-1 accent-[#806F68]"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                  {correction && (
                    <div className="mt-4 rounded-xl bg-[#F4FAF9] p-4 text-sm leading-6">
                      <p className="font-semibold">{isCorrect ? "✓ Bonne réponse" : "✗ Réponse incorrecte"}</p>
                      <p className="mt-1">Bonne réponse : {correctOption?.text || correction.correct_option_id}</p>
                      {correction.explanation && <p className="mt-2">Explication : {correction.explanation}</p>}
                    </div>
                  )}
                </div>
              );
            })}

            {!report ? (
              <button
                type="button"
                onClick={submitQuiz}
                disabled={busy !== ""}
                className="rounded-full bg-[#684F48] px-6 py-3 text-sm font-semibold text-white hover:bg-[#806F68] disabled:opacity-50"
              >
                {busy === "submit" ? "Correction en cours..." : "Terminer et corriger le QCM"}
              </button>
            ) : (
              <div className="rounded-2xl border border-[#DCE8E6] bg-[#D6E9ED] p-6">
                <p className="text-sm text-[#806F68]">Ton résultat</p>
                <p className="mt-2 text-4xl" style={{ fontFamily: "Georgia, serif" }}>
                  {report.score} / {report.total} — {Math.round(report.percentage || 0)} %
                </p>
                <p className="mt-2 text-sm">Les corrections et explications apparaissent sous chaque question.</p>
                <Link href="/progress" className="mt-4 inline-block rounded-full bg-[#684F48] px-5 py-3 text-sm font-semibold text-white">
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
