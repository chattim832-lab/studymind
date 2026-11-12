"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = "http://127.0.0.1:8001";

const COVERS = [
  "linear-gradient(135deg, #CD9FA0, #F2C1A3)",
  "linear-gradient(135deg, #857C91, #CD9FA0)",
  "linear-gradient(135deg, #F2C1A3, #F8CCAA)",
  "linear-gradient(135deg, #525871, #857C91)",
];

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

      {name === "search" && (
        <>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </>
      )}

      {name === "file" && (
        <>
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
          <path d="M13 2v7h7" />
          <path d="M8 14h8M8 18h6" />
        </>
      )}

      {name === "trash" && (
        <>
          <path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" />
          <path d="M10 10v7M14 10v7" />
        </>
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

function courseIdOf(course) {
  return course.id || course._id;
}

function formatSize(bytes) {
  if (typeof bytes !== "number") return "";
  if (bytes < 1024) return bytes + " o";
  return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
}

export default function CoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [expandedId, setExpandedId] = useState("");
  const [pdfsByCourse, setPdfsByCourse] = useState({});
  const [loadingPdfsId, setLoadingPdfsId] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingId, setUploadingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

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
          setLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      active = false;
    };
  }, [router]);

  // 2. Recuperer le JWT
  function getToken() {
    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
    }

    return token;
  }

  // 3. Charger les PDF d'un cours
  async function loadPdfs(id) {
    const token = getToken();
    if (!token) return;

    setLoadingPdfsId(id);

    try {
      const response = await fetch(
        API_URL + "/courses/" + id + "/pdfs",
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

      setPdfsByCourse((prev) => ({
        ...prev,
        [id]: Array.isArray(data) ? data : data.pdfs || [],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPdfsId("");
    }
  }

  // 4. Afficher ou masquer les PDF
  async function togglePdfs(id) {
    setError("");
    setMessage("");

    if (expandedId === id) {
      setExpandedId("");
      return;
    }

    setExpandedId(id);

    if (!Object.prototype.hasOwnProperty.call(pdfsByCourse, id)) {
      await loadPdfs(id);
    }
  }

  // 5. Ajouter un PDF
  async function handleUpload(event, id) {
    event.preventDefault();

    const form = event.currentTarget;
    const file = selectedFiles[id];

    if (!file) {
      setError("Choisissez un PDF avant de l'envoyer.");
      return;
    }

    if (
      !file.name.toLowerCase().endsWith(".pdf") ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Choisissez un PDF de 10 Mo maximum.");
      return;
    }

    const token = getToken();
    if (!token) return;

    const body = new FormData();
    body.append("file", file);

    setUploadingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        API_URL + "/courses/" + id + "/pdfs",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
          body,
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Échec de l'envoi du PDF."
        );
      }

      setSelectedFiles((prev) => ({
        ...prev,
        [id]: null,
      }));

      form.reset();
      setMessage("PDF ajouté avec succès.");

      await loadPdfs(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingId("");
    }
  }

  // 6. Supprimer un cours
  async function handleDelete(id) {
    if (!window.confirm("Supprimer ce cours et tous ses PDF ?")) {
      return;
    }

    const token = getToken();
    if (!token) return;

    setDeletingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        API_URL + "/courses/" + id,
        {
          method: "DELETE",
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
        throw new Error("Impossible de supprimer le cours.");
      }

      setCourses((prev) =>
        prev.filter((course) => courseIdOf(course) !== id)
      );

      if (expandedId === id) {
        setExpandedId("");
      }

      setMessage("Cours supprimé avec succès.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  }

  // 7. Deconnexion
  function handleLogout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

  // 8. Recherche
  const filteredCourses = courses.filter((course) =>
    (course.title || course.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
          <MenuLink href="/dashboard" icon="dashboard">
            Dashboard
          </MenuLink>

          <MenuLink href="/courses" icon="book" active>
            Mes cours
          </MenuLink>

          <MenuLink href="/chat" icon="chat">
            Chatbot IA
          </MenuLink>
        </nav>

        <div className="mt-8 rounded-2xl bg-[#E8D8DD] p-4 md:mt-auto">
          <p className="text-sm font-semibold">
            Your learning companion
          </p>

          <p className="mt-2 text-xs leading-5 text-[#857C91]">
            Organise tes cours et révise à ton rythme.
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
      <main className="min-w-0 flex-1 px-5 py-7 md:px-9">

        {/* TITRE */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2
              className="text-4xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Mes cours
            </h2>

            <p className="mt-2 text-sm text-[#857C91]">
              Tous tes supports de cours, au même endroit ♡
            </p>
          </div>

          <Link
            href="/courses/new"
            className="rounded-full bg-[#525871] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#857C91]"
          >
            + Ajouter un cours
          </Link>
        </header>

        {/* RECHERCHE ET STATISTIQUES */}
        <section className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#E8DADD] bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-[#857C91]">
              Cours enregistrés
            </p>

            <p
              className="mt-1 text-3xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {loading ? "..." : courses.length}
            </p>
          </div>

          <label className="flex items-center gap-2 rounded-full border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3">
            <Icon name="search" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un cours..."
              className="w-44 bg-transparent text-sm outline-none placeholder:text-[#AFA3AD] sm:w-56"
            />
          </label>
        </section>

        {/* MESSAGES */}
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl bg-[#F7E2E2] p-4 text-sm text-[#8A3F48]"
          >
            {error}
          </p>
        )}

        {message && (
          <p className="mb-5 rounded-xl bg-[#F1E9E7] p-4 text-sm text-[#525871]">
            {message}
          </p>
        )}

        {/* LISTE DES COURS */}
        {loading ? (
          <p className="text-sm text-[#857C91]">
            Chargement des cours...
          </p>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#CD9FA0] bg-white p-8 text-center">
            <p className="text-[#857C91]">
              Aucun cours à afficher.
            </p>

            <Link
              href="/courses/new"
              className="mt-4 inline-block rounded-full bg-[#525871] px-5 py-3 text-sm text-white"
            >
              Ajouter un cours
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-2">
            {filteredCourses.map((course, index) => {
              const id = courseIdOf(course);
              const pdfs = pdfsByCourse[id] || [];
              const isOpen = expandedId === id;

              return (
                <article
                  key={id}
                  className="overflow-hidden rounded-3xl border border-[#E8DADD] bg-white shadow-sm"
                >
                  {/* COUVERTURE DU COURS */}
                  <div
                    className="relative h-36 overflow-hidden p-5"
                    style={{
                      background: COVERS[index % COVERS.length],
                    }}
                  >
                    <div className="absolute -right-7 -top-9 h-44 w-44 rounded-full border-[17px] border-white/20" />

                    <div className="absolute bottom-0 left-9 h-20 w-20 rotate-12 rounded-xl border border-white/40 bg-white/10" />

                    <span className="relative rounded-full bg-white/70 px-3 py-1 text-xs text-[#525871]">
                      StudyMind Course
                    </span>
                  </div>

                  {/* INFORMATIONS DU COURS */}
                  <div className="p-5">
                    <h3
                      className="text-2xl"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {course.title || course.name || "Cours"}
                    </h3>

                    {course.description && (
                      <p className="mt-2 text-sm leading-6 text-[#857C91]">
                        {course.description}
                      </p>
                    )}

                    {/* BOUTONS */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => togglePdfs(id)}
                        aria-expanded={isOpen}
                        className="rounded-full bg-[#F5E3E0] px-4 py-2 text-sm font-medium text-[#525871] hover:bg-[#F2C1A3]"
                      >
                        {isOpen
                          ? "Masquer les PDF"
                          : "Voir les PDF et ajouter"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(id)}
                        disabled={deletingId === id}
                        className="inline-flex items-center gap-2 rounded-full border border-[#E8DADD] px-4 py-2 text-sm text-[#8A4C59] hover:bg-[#F7E2E2] disabled:opacity-50"
                      >
                        <Icon name="trash" />

                        {deletingId === id
                          ? "Suppression..."
                          : "Supprimer"}
                      </button>
                    </div>

                    {/* FICHIERS PDF */}
                    {isOpen && (
                      <div className="mt-5 border-t border-[#EFE5E6] pt-5">
                        <h4 className="mb-3 text-sm font-semibold">
                          Fichiers PDF
                        </h4>

                        {loadingPdfsId === id ? (
                          <p className="text-sm text-[#857C91]">
                            Chargement des PDF...
                          </p>
                        ) : pdfs.length === 0 ? (
                          <p className="text-sm text-[#857C91]">
                            Aucun PDF dans ce cours.
                          </p>
                        ) : (
                          <ul className="space-y-2">
                            {pdfs.map((pdf) => (
                              <li
                                key={pdf.id || pdf._id}
                                className="flex items-center gap-2 rounded-xl bg-[#FAF6F4] px-3 py-3 text-sm"
                              >
                                <Icon name="file" />

                                <span className="min-w-0 flex-1 break-words">
                                  {pdf.filename || "Document PDF"}
                                </span>

                                <span className="shrink-0 text-xs text-[#857C91]">
                                  {formatSize(pdf.size_bytes)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* UPLOAD PDF */}
                        <form
                          onSubmit={(event) => handleUpload(event, id)}
                          className="mt-5 space-y-3"
                        >
                          <label className="block text-sm font-semibold">
                            Ajouter un PDF (10 Mo max)
                          </label>

                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(event) =>
                              setSelectedFiles((prev) => ({
                                ...prev,
                                [id]: event.target.files?.[0] || null,
                              }))
                            }
                            className="block w-full rounded-xl border border-[#E8DADD] p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#F5E3E0] file:px-3 file:py-2 file:text-[#525871]"
                          />

                          <button
                            type="submit"
                            disabled={
                              !selectedFiles[id] ||
                              uploadingId === id
                            }
                            className="rounded-full bg-[#525871] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#857C91] disabled:opacity-50"
                          >
                            {uploadingId === id
                              ? "Envoi..."
                              : "Envoyer le PDF"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}