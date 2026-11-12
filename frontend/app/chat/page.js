"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8001";

// Icones de navigation
function Icon({ name }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "dashboard" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      )}

      {name === "book" && (
        <>
          <path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1" />
          <path d="M12 6c3-2 6-2 9-1v14c-3-1-6-1-9 1" />
          <path d="M12 6v14" />
        </>
      )}

      {name === "chat" && (
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l1.7-3.4A7.5 7.5 0 1 1 20 11.5Z" />
      )}

      {name === "logout" && (
        <>
          <path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
          <path d="M15 16l4-4-4-4" />
          <path d="M19 12H9" />
        </>
      )}

      {name === "send" && (
        <>
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </>
      )}

      {name === "sparkles" && (
        <>
          <path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z" />
          <path d="m19 18 .5 1.5L21 20l-1.5.5L19 22l-.5-1.5L17 20l1.5-.5L19 18Z" />
        </>
      )}
    </svg>
  );
}

// Lien dans la sidebar
function MenuLink({
  href,
  icon,
  children,
  active = false,
}) {
  return (
    <Link
      href={href}
      className={
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition " +
        (active
          ? "bg-[#E6D4D9] font-semibold text-[#525871]"
          : "text-[#857C91] hover:bg-white/70 hover:text-[#525871]")
      }
    >
      <Icon name={icon} />
      {children}
    </Link>
  );
}

// Identifiant d'un cours ou PDF
function getId(item) {
  return item.id || item._id || item.course_id || item.pdf_id;
}

// Afficher le texte avec les mots en gras
function formatAnswer(answer) {
  return String(answer || "")
    .split(/(\\[^]+\\*)/g)
    .map((part, index) =>
      part.startsWith("*") && part.endsWith("*") ? (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={index}>{part}</span>
      )
    );
}

export default function ChatPage() {
  const router = useRouter();

  // Cours
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  // PDF
  const [pdfs, setPdfs] = useState([]);
  const [pdfId, setPdfId] = useState("");

  // Question et reponse
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);

  // Chargement et erreurs
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Charger les cours
  useEffect(() => {
    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;

    async function loadCourses() {
      try {
        const response = await fetch(API_URL + "/courses", {
          headers: {
            Authorization: "Bearer " + token,
          },
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Impossible de charger les cours.");
        }

        const data = await response.json();

        if (active) {
          setCourses(
            Array.isArray(data) ? data : data.courses || []
          );
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, [router]);

  // 2. Charger les PDF du cours choisi
  async function handleCourseChange(event) {
    const selectedId = event.target.value;

    setCourseId(selectedId);
    setPdfId("");
    setPdfs([]);
    setResult(null);
    setError("");

    if (!selectedId) {
      return;
    }

    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoadingPdfs(true);

    try {
      const response = await fetch(
        API_URL + "/courses/" + selectedId + "/pdfs",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Impossible de charger les PDF.");
      }

      const data = await response.json();

      setPdfs(
        Array.isArray(data) ? data : data.pdfs || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPdfs(false);
    }
  }

  // 3. Envoyer la question au Backend
  async function handleSend(event) {
    event.preventDefault();

    if (!courseId || !pdfId || !question.trim()) {
      setError(
        "Choisissez un cours, un PDF et une question."
      );
      return;
    }

    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(API_URL + "/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          course_id: courseId,
          pdf_id: pdfId,
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Erreur lors de la génération de la réponse."
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 4. Deconnexion
  function handleLogout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

  // 5. Interface
  return (
    <div className="min-h-screen bg-[#FAF6F4] text-[#525871] md:flex">

      {/* SIDEBAR */}
      <aside className="flex w-full shrink-0 flex-col border-b border-[#E7DADD] bg-[#F3E9E7] p-5 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">

        <div className="mb-8 px-3 pt-3">
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            StudyMind
          </h1>

          <p className="mt-1 text-xs tracking-widest text-[#857C91]">
            YOUR STUDY SPACE
          </p>
        </div>

        <p className="mb-3 px-4 text-xs uppercase tracking-widest text-[#A38E98]">
          Menu
        </p>

        <nav className="flex flex-col gap-2">
          <MenuLink
            href="/dashboard"
            icon="dashboard"
          >
            Dashboard
          </MenuLink>

          <MenuLink href="/courses" icon="book">
            Mes cours
          </MenuLink>

          <MenuLink
            href="/chat"
            icon="chat"
            active
          >
            Chatbot IA
          </MenuLink>
        </nav>

        <div className="mt-8 rounded-2xl bg-[#E8D8DD] p-4 md:mt-auto">
          <p className="text-sm font-semibold">
            Your learning companion
          </p>

          <p className="mt-2 text-xs leading-5 text-[#857C91]">
            Pose tes questions et comprends tes cours
            avec ton assistant intelligent.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#857C91] hover:bg-white/70"
        >
          <Icon name="logout" />
          Déconnexion
        </button>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">

        {/* EN-TETE */}
        <header className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#CD9FA0]">
            YOUR AI STUDY ASSISTANT
          </p>

          <h2
            className="text-4xl md:text-5xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Chatbot IA
          </h2>

          <p className="mt-3 text-sm text-[#857C91]">
            Ton assistant pour comprendre et réviser tes cours ♡
          </p>
        </header>

        {/* BANNIERE */}
        <section
          className="relative mb-8 overflow-hidden rounded-3xl p-7 text-white shadow-sm md:p-9"
          style={{
            background:
              "linear-gradient(115deg, #525871 0%, #857C91 60%, #CD9FA0 100%)",
          }}
        >
          <div className="absolute -right-8 -top-12 h-48 w-48 rounded-full border-[22px] border-white/10" />

          <div className="absolute bottom-0 right-24 h-24 w-24 rounded-full bg-white/10 blur-xl" />

          <div className="relative">
            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-white/70">
              <Icon name="sparkles" />
              StudyMind Intelligence
            </p>

            <h3
              className="max-w-xl text-3xl md:text-4xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Ask, learn & understand.
            </h3>

            <p className="mt-3 max-w-lg text-sm leading-6 text-white/80">
              Choisis ton PDF, pose ta question en français
              ou en anglais et découvre une réponse basée
              sur ton cours, avec les pages sources.
            </p>
          </div>
        </section>

        {/* FORMULAIRE */}
        <section className="rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm md:p-8">

          <div className="mb-7">
            <h3
              className="text-2xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Pose ta question
            </h3>

            <p className="mt-2 text-sm text-[#857C91]">
              Sélectionne ton cours puis ton document PDF.
            </p>
          </div>

          <form
            onSubmit={handleSend}
            className="space-y-6"
          >

            {/* COURS */}
            <div>
              <label
                htmlFor="chat-course"
                className="mb-2 block text-sm font-semibold"
              >
                Choisir un cours
              </label>

              <select
                id="chat-course"
                value={courseId}
                onChange={handleCourseChange}
                disabled={loadingCourses}
                className="w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm text-[#525871] outline-none focus:border-[#CD9FA0] disabled:opacity-60"
              >
                <option value="">
                  {loadingCourses
                    ? "Chargement des cours..."
                    : "Sélectionner un cours"}
                </option>

                {courses.map((course) => (
                  <option
                    key={getId(course)}
                    value={getId(course)}
                  >
                    {course.title || course.name || "Cours"}
                  </option>
                ))}
              </select>
            </div>

            {/* PDF */}
            <div>
              <label
                htmlFor="chat-pdf"
                className="mb-2 block text-sm font-semibold"
              >
                Choisir un PDF
              </label>

              <select
                id="chat-pdf"
                value={pdfId}
                onChange={(event) => {
                  setPdfId(event.target.value);
                  setResult(null);
                }}
                disabled={!courseId || loadingPdfs}
                className="w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm text-[#525871] outline-none focus:border-[#CD9FA0] disabled:opacity-60"
              >
                <option value="">
                  {loadingPdfs
                    ? "Chargement des PDF..."
                    : "Sélectionner un PDF"}
                </option>

                {pdfs.map((pdf) => (
                  <option
                    key={getId(pdf)}
                    value={getId(pdf)}
                  >
                    {pdf.filename || pdf.name || "PDF"}
                  </option>
                ))}
              </select>

              {courseId && !loadingPdfs && pdfs.length === 0 && (
                <p className="mt-2 text-xs text-[#857C91]">
                  Aucun PDF disponible dans ce cours.
                </p>
              )}
            </div>

            {/* QUESTION */}
            <div>
              <label
                htmlFor="chat-question"
                className="mb-2 block text-sm font-semibold"
              >
                Ta question
              </label>

              <textarea
                id="chat-question"
                value={question}
                onChange={(event) =>
                  setQuestion(event.target.value)
                }
                placeholder="Exemple : Quels sont les 5 V du Big Data ?"
                rows={5}
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm text-[#525871] outline-none placeholder:text-[#AFA3AD] focus:border-[#CD9FA0]"
              />

              <p className="mt-2 text-right text-xs text-[#A38E98]">
                {question.length}/2000 caractères
              </p>
            </div>

            {/* BOUTON */}
            <button
              type="submit"
              disabled={
                loading ||
                !courseId ||
                !pdfId ||
                !question.trim()
              }
              className="inline-flex items-center gap-3 rounded-full bg-[#525871] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#857C91] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="send" />

              {loading
                ? "Gemini réfléchit..."
                : "Envoyer ma question"}
            </button>
          </form>
        </section>

        {/* ERREUR */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl bg-[#F7E2E2] p-5 text-sm text-[#8A3F48]"
          >
            {error}
          </div>
        )}

        {/* REPONSE */}
        {result && (
          <section className="mt-7 overflow-hidden rounded-3xl border border-[#E8DADD] bg-white shadow-sm">

            <div className="bg-[#F5E3E0] px-6 py-5 md:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/70 p-3">
                  <Icon name="sparkles" />
                </div>

                <div>
                  <h3
                    className="text-2xl"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Réponse du chatbot
                  </h3>

                  <p className="mt-1 text-xs text-[#857C91]">
                    Basée sur les passages de ton cours
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="whitespace-pre-wrap break-words text-sm leading-8 text-[#525871]">
                {formatAnswer(result.answer)}
              </div>

              {/* PAGES SOURCES */}
              {result.source_pages?.length > 0 && (
                <div className="mt-7 border-t border-[#EFE5E6] pt-6">
                  <h4 className="mb-3 text-sm font-semibold">
                    Pages des passages consultés
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {result.source_pages.map((page) => (
                      <span
                        key={page}
                        className="rounded-full bg-[#F5E3E0] px-4 py-2 text-xs font-medium text-[#525871]"
                      >
                        Page {page}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* MESSAGE EN BAS */}
        <p className="mt-8 text-center text-xs text-[#A38E98]">
          StudyMind ♡ Your peaceful learning space
        </p>
      </main>
    </div>
  );
}