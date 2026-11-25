"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8001";

function getId(item) {
  return String(item?.id || item?._id || "");
}

function getError(data, fallback) {
  return typeof data?.detail === "string"
    ? data.detail
    : fallback;
}

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
        <path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3Z" />
      )}
    </svg>
  );
}

function MenuLink({ href, icon, children, active = false }) {
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

// Charger les PDF depuis FastAPI
async function fetchCoursePdfs(courseId, token) {
  const response = await fetch(
    API_URL +
      "/courses/" +
      encodeURIComponent(courseId) +
      "/pdfs",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Impossible de charger les PDF du cours.");
  }

  const data = await response.json();

  return Array.isArray(data) ? data : data.pdfs || [];
}

// Afficher le gras dans les reponses Gemini
function formatAnswer(answer) {
  return String(answer || "")
    .split(/(\\[^]+\\*)/g)
    .map((part, index) => {
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <span key={index}>{part}</span>;
    });
}

export default function ChatPage() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");

  const [pdfs, setPdfs] = useState([]);
  const [pdfId, setPdfId] = useState("");

  // pdf = un PDF, course = tout le cours
  const [scope, setScope] = useState("pdf");

  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const [error, setError] = useState("");

  // 1. Charger les cours et lire les parametres de l'URL
  useEffect(() => {
    let active = true;

    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function initializeChat() {
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

        const loadedCourses = Array.isArray(data)
          ? data
          : data.courses || [];

        if (!active) return;

        setCourses(loadedCourses);

        // Exemple : /chat?course_id=123&pdf_id=456
        const params = new URLSearchParams(
          window.location.search
        );

        const initialCourseId = params.get("course_id") || "";
        const initialPdfId = params.get("pdf_id") || "";

        const initialScope =
          params.get("scope") === "course"
            ? "course"
            : "pdf";

        const courseExists = loadedCourses.some(
          (course) => getId(course) === initialCourseId
        );

        if (!initialCourseId || !courseExists) {
          return;
        }

        // Selection automatique du cours
        setCourseId(initialCourseId);
        setScope(initialScope);

        setLoadingPdfs(true);

        try {
          const loadedPdfs = await fetchCoursePdfs(
            initialCourseId,
            token
          );

          if (!active) return;

          setPdfs(loadedPdfs);

          // Selection automatique du PDF
          if (
            initialScope === "pdf" &&
            initialPdfId &&
            loadedPdfs.some(
              (pdf) => getId(pdf) === initialPdfId
            )
          ) {
            setPdfId(initialPdfId);
          }
        } finally {
          if (active) setLoadingPdfs(false);
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

    initializeChat();

    return () => {
      active = false;
    };
  }, [router]);

  // 2. Changer le cours manuellement
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
      const loadedPdfs = await fetchCoursePdfs(
        selectedId,
        token
      );

      setPdfs(loadedPdfs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPdfs(false);
    }
  }

  // 3. Choisir le mode de discussion
  function handleScopeChange(newScope) {
    setScope(newScope);
    setResult(null);
    setError("");
  }

  // 4. Envoyer la question a Gemini
  async function handleSend(event) {
    event.preventDefault();

    if (!courseId || !question.trim()) {
      setError("Choisissez un cours et écrivez une question.");
      return;
    }

    if (scope === "pdf" && !pdfId) {
      setError("Choisissez un fichier PDF.");
      return;
    }

    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoadingAnswer(true);
    setError("");
    setResult(null);

    // Route actuelle pour un PDF
    // Nouvelle route Sprint 3 pour tout le cours
    const endpoint =
      scope === "course"
        ? "/chat/course"
        : "/chat";

    const body =
      scope === "course"
        ? {
            course_id: courseId,
            question: question.trim(),
          }
        : {
            course_id: courseId,
            pdf_id: pdfId,
            question: question.trim(),
          };

    try {
      const response = await fetch(API_URL + endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (scope === "course" && response.status === 404) {
          throw new Error(
            "Le mode Tout le cours nécessite encore " +
              "la nouvelle API du Sprint 3."
          );
        }

        throw new Error(
          getError(
            data,
            "Impossible de générer la réponse."
          )
        );
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAnswer(false);
    }
  }

  // 5. Deconnexion
  function handleLogout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

  const selectedCourse = courses.find(
    (course) => getId(course) === courseId
  );

  const selectedPdf = pdfs.find(
    (pdf) => getId(pdf) === pdfId
  );

  return (
    <div className="min-h-screen bg-[#FAF6F4] text-[#525871] md:flex">

      {/* SIDEBAR */}
      <aside className="flex w-full shrink-0 flex-col border-b border-[#E7DADD] bg-[#F3E9E7] p-5 md:sticky md:top-0 md:h-screen md:w-60 md:border-r">

        <div className="mb-8 px-3 pt-3">
          <h1
            className="text-3xl font-semibold"
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

        <nav className="space-y-2">
          <MenuLink href="/dashboard" icon="dashboard">
            Dashboard
          </MenuLink>

          <MenuLink href="/courses" icon="book">
            Mes cours
          </MenuLink>

          <MenuLink href="/chat" icon="chat" active>
            Chatbot IA
          </MenuLink>
        </nav>

        <div className="mt-8 rounded-2xl bg-[#E8D8DD] p-4 md:mt-auto">
          <p className="text-sm font-semibold">
            Your learning companion
          </p>

          <p className="mt-2 text-xs text-[#857C91]">
            Pose tes questions et révise à ton rythme.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#857C91] hover:bg-white"
        >
          <Icon name="logout" />
          Déconnexion
        </button>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">

        {/* EN-TETE */}
        <header className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-widest text-[#CD9FA0]">
            YOUR AI STUDY ASSISTANT
          </p>

          <h2
            className="text-4xl md:text-5xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Chatbot IA
          </h2>

          <p className="mt-3 text-sm text-[#857C91]">
            Ton assistant intelligent pour réviser tes cours ♡
          </p>
        </header>

        {/* BANNIERE */}
        <section
          className="mb-8 rounded-3xl p-7 text-white"
          style={{
            background:
              "linear-gradient(115deg, #525871, #857C91, #CD9FA0)",
          }}
        >
          <div className="mb-3 flex items-center gap-2 text-sm text-white/80">
            <Icon name="sparkles" />
            StudyMind Intelligence
          </div>

          <h3
            className="text-3xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Ask, learn & understand.
          </h3>

          <p className="mt-3 text-sm text-white/85">
            Choisis un document ou un cours complet
            pour discuter avec Gemini.
          </p>
        </section>

        {/* FORMULAIRE */}
        <section className="rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm md:p-8">

          <h3
            className="mb-3 text-2xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Pose ta question
          </h3>

          <p className="mb-7 text-sm text-[#857C91]">
            Tu peux discuter avec un PDF ou tous les PDF
            du même cours.
          </p>

          <form onSubmit={handleSend} className="space-y-6">

            {/* SELECTION DU MODE */}
            <div>
              <label className="mb-3 block text-sm font-semibold">
                Mode de discussion
              </label>

              <div className="grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() => handleScopeChange("pdf")}
                  aria-pressed={scope === "pdf"}
                  className={
                    "rounded-2xl border p-4 text-left transition " +
                    (scope === "pdf"
                      ? "border-[#525871] bg-[#F5E3E0]"
                      : "border-[#E8DADD] bg-[#FAF6F4]")
                  }
                >
                  <span className="block font-semibold">
                    Un seul PDF
                  </span>

                  <span className="mt-1 block text-xs text-[#857C91]">
                    Poser des questions sur un document.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScopeChange("course")}
                  aria-pressed={scope === "course"}
                  className={
                    "rounded-2xl border p-4 text-left transition " +
                    (scope === "course"
                      ? "border-[#525871] bg-[#F5E3E0]"
                      : "border-[#E8DADD] bg-[#FAF6F4]")
                  }
                >
                  <span className="block font-semibold">
                    Tout le cours
                  </span>

                  <span className="mt-1 block text-xs text-[#857C91]">
                    Poser des questions sur tous les PDF.
                  </span>
                </button>
              </div>
            </div>

            {/* SELECTION DU COURS */}
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
                className="w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm outline-none disabled:opacity-60"
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

            {/* SELECTION DU PDF */}
            {scope === "pdf" && (
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
                    setError("");
                  }}
                  disabled={!courseId || loadingPdfs}
                  className="w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm outline-none disabled:opacity-60"
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
                      {pdf.filename || "Document PDF"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* INFORMATIONS */}
            {courseId && (
              <div className="rounded-xl bg-[#F5E3E0] p-4 text-sm">
                <p className="font-semibold">
                  {selectedCourse?.title ||
                    selectedCourse?.name ||
                    "Cours sélectionné"}
                </p>

                <p className="mt-1 text-xs text-[#857C91]">
                  {scope === "course"
                    ? "Mode : tous les PDF du cours"
                    : selectedPdf
                      ? "Document : " + selectedPdf.filename
                      : "Sélectionne un PDF pour continuer"}
                </p>
              </div>
            )}

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
                placeholder="Exemple : Explique les composants de Hadoop."
                rows={5}
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm outline-none placeholder:text-[#AFA3AD] focus:border-[#CD9FA0]"
              />

              <p className="mt-2 text-right text-xs text-[#A38E98]">
                {question.length}/2000 caractères
              </p>
            </div>

            {/* ENVOYER */}
            <button
              type="submit"
              disabled={
                loadingAnswer ||
                !courseId ||
                (scope === "pdf" && !pdfId) ||
                !question.trim()
              }
              className="inline-flex items-center gap-3 rounded-full bg-[#525871] px-6 py-3 text-sm font-semibold text-white hover:bg-[#857C91] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="send" />

              {loadingAnswer
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

            <div className="bg-[#F5E3E0] px-6 py-5">
              <h3
                className="text-2xl"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Réponse du Chatbot
              </h3>

              <p className="mt-2 text-xs text-[#857C91]">
                Réponse générée à partir des documents.
              </p>
            </div>

            <div className="p-6">

              <div className="whitespace-pre-wrap text-sm leading-8">
                {formatAnswer(result.answer)}
              </div>

              {/* SOURCES MULTI-PDF */}
              {Array.isArray(result.sources) &&
                result.sources.length > 0 && (
                  <div className="mt-7 border-t border-[#E8DADD] pt-5">
                    <h4 className="mb-3 font-semibold">
                      Documents sources
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {result.sources.map((source, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-[#F5E3E0] px-4 py-2 text-xs"
                        >
                          {source.filename ||
                            source.pdf_name ||
                            "Document"}
                          {source.page
                            ? " — Page " + source.page
                            : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* SOURCES PDF UNIQUE */}
              {(!result.sources ||
                result.sources.length === 0) &&
                Array.isArray(result.source_pages) &&
                result.source_pages.length > 0 && (
                  <div className="mt-7 border-t border-[#E8DADD] pt-5">
                    <h4 className="mb-3 font-semibold">
                      Pages sources
                    </h4>

                    <div className="flex flex-wrap gap-2">
                      {result.source_pages.map((page) => (
                        <span
                          key={page}
                          className="rounded-full bg-[#F5E3E0] px-4 py-2 text-xs"
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

        <p className="mt-8 text-center text-xs text-[#A38E98]">
          StudyMind ♡ Your peaceful learning space
        </p>
      </main>
    </div>
  );
}