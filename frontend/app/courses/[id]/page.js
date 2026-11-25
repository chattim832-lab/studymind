"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8001";

function getId(item) {
  return String(item?.id || item?._id || "");
}

function getErrorMessage(data, fallback) {
  return typeof data?.detail === "string"
    ? data.detail
    : fallback;
}

export default function CourseDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const courseId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const fileInputRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [pdfs, setPdfs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [uploading, setUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function getToken() {
    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
    }

    return token;
  }

  // Charger le cours et ses fichiers PDF
  useEffect(() => {
    let active = true;

    async function loadCourse() {
      const token = sessionStorage.getItem("studymind_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const headers = {
          Authorization: "Bearer " + token,
        };

        const [coursesResponse, pdfsResponse] =
          await Promise.all([
            fetch(API_URL + "/courses", { headers }),
            fetch(
              API_URL +
                "/courses/" +
                encodeURIComponent(courseId) +
                "/pdfs",
              { headers }
            ),
          ]);

        if (
          coursesResponse.status === 401 ||
          pdfsResponse.status === 401
        ) {
          router.replace("/login");
          return;
        }

        if (!coursesResponse.ok || !pdfsResponse.ok) {
          throw new Error(
            "Impossible de charger les informations du cours."
          );
        }

        const coursesData = await coursesResponse.json();
        const pdfsData = await pdfsResponse.json();

        const allCourses = Array.isArray(coursesData)
          ? coursesData
          : coursesData.courses || [];

        const courseFound = allCourses.find(
          (item) => getId(item) === String(courseId)
        );

        if (!courseFound) {
          throw new Error("Cours introuvable.");
        }

        if (active) {
          setCourse(courseFound);
          setPdfs(
            Array.isArray(pdfsData)
              ? pdfsData
              : pdfsData.pdfs || []
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

    if (courseId) {
      loadCourse();
    }

    return () => {
      active = false;
    };
  }, [courseId, router]);

  // Actualiser la liste des PDF
  async function refreshPdfs() {
    const token = getToken();
    if (!token) return;

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

    if (response.status === 401) {
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      throw new Error("Impossible de recharger les PDF.");
    }

    const data = await response.json();

    setPdfs(
      Array.isArray(data) ? data : data.pdfs || []
    );
  }

  // Ajouter un PDF
  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Veuillez sélectionner un PDF.");
      return;
    }

    if (
      !selectedFile.name.toLowerCase().endsWith(".pdf") ||
      selectedFile.size > 10 * 1024 * 1024
    ) {
      setError("Choisissez un PDF de 10 Mo maximum.");
      return;
    }

    const token = getToken();
    if (!token) return;

    setUploading(true);
    setError("");
    setMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(
        API_URL +
          "/courses/" +
          encodeURIComponent(courseId) +
          "/pdfs",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          getErrorMessage(data, "Erreur lors de l'upload.")
        );
      }

      await refreshPdfs();

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setMessage("PDF ajouté avec succès !");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  // Supprimer un PDF avec confirmation
  async function handleDeletePdf(pdf) {
    const pdfId = getId(pdf);

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer le fichier \"" +
        (pdf.filename || "PDF") +
        "\" ? Cette action est définitive."
    );

    if (!confirmed) return;

    const token = getToken();
    if (!token) return;

    setDeletingId(pdfId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        API_URL +
          "/courses/" +
          encodeURIComponent(courseId) +
          "/pdfs/" +
          encodeURIComponent(pdfId),
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
        const data = await response.json().catch(() => ({}));

        throw new Error(
          getErrorMessage(data, "Impossible de supprimer le PDF.")
        );
      }

      setPdfs((previous) =>
        previous.filter((item) => getId(item) !== pdfId)
      );

      setMessage("PDF supprimé avec succès !");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

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

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block rounded-xl px-4 py-3 text-sm text-[#857C91] hover:bg-white"
          >
            Dashboard
          </Link>

          <Link
            href="/courses"
            className="block rounded-xl bg-[#E6D4D9] px-4 py-3 text-sm font-semibold"
          >
            Mes cours
          </Link>

          <Link
            href="/chat"
            className="block rounded-xl px-4 py-3 text-sm text-[#857C91] hover:bg-white"
          >
            Chatbot IA
          </Link>
        </nav>

        <div className="mt-8 rounded-2xl bg-[#E8D8DD] p-4 md:mt-auto">
          <p className="text-sm font-semibold">
            Your learning companion
          </p>

          <p className="mt-2 text-xs leading-5 text-[#857C91]">
            Tous tes documents, au même endroit.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="mt-5 rounded-xl px-4 py-3 text-left text-sm text-[#857C91] hover:bg-white"
        >
          Déconnexion
        </button>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">

        <Link
          href="/courses"
          className="mb-6 inline-block text-sm text-[#857C91] hover:text-[#525871]"
        >
          ← Retour à mes cours
        </Link>

        {loading ? (
          <p>Chargement du cours...</p>
        ) : !course ? (
          <p className="rounded-xl bg-white p-5">
            {error || "Cours introuvable."}
          </p>
        ) : (
          <>
            {/* EN-TETE DU COURS */}
            <section
              className="relative mb-8 overflow-hidden rounded-3xl p-8 text-white"
              style={{
                background:
                  "linear-gradient(115deg, #525871, #857C91, #CD9FA0)",
              }}
            >
              <div className="relative">
                <p className="mb-3 text-xs uppercase tracking-widest text-white/70">
                  MY STUDY COURSE
                </p>

                <h2
                  className="text-4xl md:text-5xl"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {course.title || course.name || "Cours"}
                </h2>

                {course.description && (
                  <p className="mt-4 max-w-xl text-sm leading-7 text-white/85">
                    {course.description}
                  </p>
                )}

                <p className="mt-5 text-sm text-white/80">
                  {pdfs.length} document(s) PDF
                </p>
              </div>
            </section>

            {/* CHATBOT DE TOUT LE COURS */}
            <section className="mb-8 rounded-3xl border border-[#E8DADD] bg-[#F5E3E0] p-6">
              <h3
                className="text-2xl"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Discuter avec tout le cours
              </h3>

              <p className="mb-5 mt-2 text-sm text-[#857C91]">
                Pose une question sur tous les PDF de cette matière.
              </p>

              <Link
                href={
                  "/chat?course_id=" +
                  encodeURIComponent(courseId) +
                  "&scope=course"
                }
                className="inline-block rounded-full bg-[#525871] px-6 py-3 text-sm font-semibold text-white hover:bg-[#857C91]"
              >
                Chatbot du cours entier
              </Link>
            </section>

            {/* DOCUMENTS PDF */}
            <section className="rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm md:p-8">

              <h3
                className="mb-2 text-3xl"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Documents du cours
              </h3>

              <p className="mb-7 text-sm text-[#857C91]">
                Organise et consulte tes fichiers PDF.
              </p>

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
                <p
                  role="status"
                  className="mb-5 rounded-xl bg-[#F1E9E7] p-4 text-sm"
                >
                  {message}
                </p>
              )}

              {/* LISTE DES PDF */}
              <div className="space-y-4">
                {pdfs.length === 0 ? (
                  <p className="rounded-xl bg-[#FAF6F4] p-5 text-sm text-[#857C91]">
                    Aucun PDF dans ce cours.
                  </p>
                ) : (
                  pdfs.map((pdf) => (
                    <div
                      key={getId(pdf)}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#EFE5E6] bg-[#FAF6F4] p-5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-semibold">
                          📄 {pdf.filename || "Document PDF"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {/* CHATBOT DU PDF */}
                        <Link
                          href={
                            "/chat?course_id=" +
                            encodeURIComponent(courseId) +
                            "&pdf_id=" +
                            encodeURIComponent(getId(pdf))
                          }
                          className="rounded-full bg-[#E8D8DD] px-4 py-2 text-sm font-medium hover:bg-[#CD9FA0]"
                        >
                          Chatbot
                        </Link>

                        {/* SUPPRESSION */}
                        <button
                          type="button"
                          onClick={() => handleDeletePdf(pdf)}
                          disabled={deletingId === getId(pdf)}
                          className="rounded-full border border-[#CD9FA0] px-4 py-2 text-sm text-[#8A4C59] hover:bg-[#F7E2E2] disabled:opacity-50"
                        >
                          {deletingId === getId(pdf)
                            ? "Suppression..."
                            : "Supprimer"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* UPLOAD PDF */}
              <form
                onSubmit={handleUpload}
                className="mt-8 border-t border-[#EFE5E6] pt-7"
              >
                <h4 className="mb-4 text-lg font-semibold">
                  Ajouter un document
                </h4>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) =>
                    setSelectedFile(
                      event.target.files?.[0] || null
                    )
                  }
                  className="mb-4 block w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] p-3 text-sm"
                />

                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="rounded-full bg-[#525871] px-6 py-3 text-sm font-semibold text-white hover:bg-[#857C91] disabled:opacity-50"
                >
                  {uploading
                    ? "Upload en cours..."
                    : "+ Ajouter le PDF"}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}