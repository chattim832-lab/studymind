"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import StudyShell, { apiRequest, getId } from "../../_components/StudyShell";

function revisionUrl(courseId, pdfId, tab) {
  return (
    "/revision?course_id=" + encodeURIComponent(courseId) +
    "&pdf_id=" + encodeURIComponent(pdfId) +
    "&tab=" + encodeURIComponent(tab)
  );
}

function sizeLabel(bytes) {
  return typeof bytes === "number" ? (bytes / 1024 / 1024).toFixed(2) + " Mo" : "";
}

function CourseDetailsContent() {
  const params = useParams();
  const courseId = String(Array.isArray(params.id) ? params.id[0] : params.id || "");
  const fileInputRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadCourse() {
      try {
        const [allCourses, allPdfs] = await Promise.all([
          apiRequest("/courses"),
          apiRequest("/courses/" + encodeURIComponent(courseId) + "/pdfs"),
        ]);
        const courses = Array.isArray(allCourses) ? allCourses : allCourses.courses || [];
        const found = courses.find((item) => getId(item) === courseId);
        if (!found) throw new Error("Cours introuvable.");
        if (active) {
          setCourse(found);
          setPdfs(Array.isArray(allPdfs) ? allPdfs : allPdfs.pdfs || []);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (courseId) loadCourse();
    return () => { active = false; };
  }, [courseId]);

  async function refreshPdfs() {
    const data = await apiRequest("/courses/" + encodeURIComponent(courseId) + "/pdfs");
    setPdfs(Array.isArray(data) ? data : data.pdfs || []);
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Sélectionne d'abord un fichier PDF.");
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".pdf") || selectedFile.size > 10 * 1024 * 1024) {
      setError("Choisis un PDF de 10 Mo maximum.");
      return;
    }
    const body = new FormData();
    body.append("file", selectedFile);
    setUploading(true);
    setError("");
    setMessage("");
    try {
      await apiRequest("/courses/" + encodeURIComponent(courseId) + "/pdfs", {
        method: "POST",
        body,
      });
      await refreshPdfs();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("PDF ajouté avec succès !");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(pdf) {
    const pdfId = getId(pdf);
    if (!window.confirm('Supprimer définitivement « ' + pdf.filename + ' » ?')) return;
    setDeletingId(pdfId);
    setError("");
    setMessage("");
    try {
      await apiRequest(
        "/courses/" + encodeURIComponent(courseId) + "/pdfs/" + encodeURIComponent(pdfId),
        { method: "DELETE" }
      );
      setPdfs((previous) => previous.filter((item) => getId(item) !== pdfId));
      setMessage("PDF supprimé avec succès.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId("");
    }
  }

  const wholeCourseChat = "/chat?course_id=" + encodeURIComponent(courseId) + "&scope=course";

  return (
    <StudyShell>
      <Link href="/courses" className="mb-6 inline-block text-sm text-[#806F68] hover:underline">
        ← Retour à mes cours
      </Link>
      {loading ? (
        <p>Chargement du cours...</p>
      ) : !course ? (
        <p role="alert" className="rounded-xl bg-white p-6">{error || "Cours introuvable."}</p>
      ) : (
        <>
          <section
            className="relative mb-7 overflow-hidden rounded-3xl p-8 text-white"
            style={{ background: "linear-gradient(115deg, #684F48 0%, #93A8AD 100%)" }}
          >
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-44 w-44 rounded-full border-[20px] border-white/10" />
            <div className="relative">
              <p className="mb-3 text-xs uppercase tracking-widest text-white/70">MY STUDY COURSE</p>
              <h1 className="text-4xl md:text-5xl" style={{ fontFamily: "Georgia, serif" }}>
                {course.title || course.name || "Cours"}
              </h1>
              {course.description && <p className="mt-4 max-w-xl text-sm leading-7 text-white/85">{course.description}</p>}
              <p className="mt-5 text-sm text-white/80">{pdfs.length} document(s) PDF</p>
            </div>
          </section>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-[#DCE8E6] bg-[#D6E9ED] p-6">
              <h2 className="text-2xl" style={{ fontFamily: "Georgia, serif" }}>Chatbot du cours entier</h2>
              <p className="my-3 text-sm text-[#806F68]">Pose une question sur tous les PDF de cette matière.</p>
              <Link href={wholeCourseChat} className="inline-block rounded-full bg-[#684F48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#846B62]">
                Discuter avec tout le cours
              </Link>
            </section>
            <section className="rounded-3xl border border-[#DCE8E6] bg-[#F9E7C7] p-6">
              <h2 className="text-2xl" style={{ fontFamily: "Georgia, serif" }}>Réviser ce cours</h2>
              <p className="my-3 text-sm text-[#806F68]">Choisis un PDF pour générer un résumé, une fiche ou un quiz.</p>
              <Link href={"/revision?course_id=" + encodeURIComponent(courseId)} className="inline-block rounded-full bg-[#684F48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#846B62]">
                Commencer la révision
              </Link>
            </section>
          </div>

          <section className="rounded-3xl border border-[#DCE8E6] bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-3xl" style={{ fontFamily: "Georgia, serif" }}>Documents du cours</h2>
            <p className="mb-6 mt-2 text-sm text-[#806F68]">Ajoute des PDF et accède directement aux outils IA.</p>
            {error && <p role="alert" className="mb-4 rounded-xl bg-[#F9E7C7] p-4 text-sm text-[#684F48]">{error}</p>}
            {message && <p role="status" className="mb-4 rounded-xl bg-[#F4FAF9] p-4 text-sm">{message}</p>}

            <form onSubmit={handleUpload} className="mb-7 flex flex-wrap items-center gap-3 rounded-2xl bg-[#FFFDF8] p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="max-w-full flex-1 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#D6E9ED] file:px-4 file:py-2 file:text-[#684F48]"
              />
              <button
                type="submit"
                disabled={uploading}
                className="rounded-full bg-[#684F48] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {uploading ? "Ajout en cours..." : "+ Ajouter un PDF"}
              </button>
            </form>

            {pdfs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#DCE8E6] p-6 text-center text-sm text-[#806F68]">
                Aucun PDF dans ce cours pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {pdfs.map((pdf) => {
                  const pdfId = getId(pdf);
                  const chatLink = "/chat?course_id=" + encodeURIComponent(courseId) + "&pdf_id=" + encodeURIComponent(pdfId);
                  return (
                    <article key={pdfId} className="rounded-2xl border border-[#DCE8E6] bg-[#FFFDF8] p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-semibold">📄 {pdf.filename || "Document.pdf"}</p>
                          <p className="mt-1 text-xs text-[#806F68]">{sizeLabel(pdf.size_bytes)}</p>
                        </div>
                        {/* Les actions sont directement a cote du PDF, pas cachees ailleurs. */}
                        <div className="flex max-w-full flex-wrap items-center gap-2">
                          <Link href={chatLink} className="rounded-full bg-[#684F48] px-4 py-2 text-xs font-semibold text-white hover:bg-[#846B62]">Chatbot PDF</Link>
                          <button type="button" disabled={deletingId === pdfId} onClick={() => handleDelete(pdf)} className="rounded-full border border-[#D8BDB1] bg-white px-4 py-2 text-xs font-semibold text-[#855C57] hover:bg-[#F9E7C7] disabled:opacity-50">
                            {deletingId === pdfId ? "Suppression..." : "Supprimer PDF"}
                          </button>
                          <Link href={revisionUrl(courseId, pdfId, "summary")} className="rounded-full bg-[#D6E9ED] px-4 py-2 text-xs font-semibold hover:bg-[#C4DADD]">Résumé</Link>
                          <Link href={revisionUrl(courseId, pdfId, "sheet")} className="rounded-full bg-[#D6E9ED] px-4 py-2 text-xs font-semibold hover:bg-[#C4DADD]">Fiche</Link>
                          <Link href={revisionUrl(courseId, pdfId, "quiz")} className="rounded-full bg-[#F9E7C7] px-4 py-2 text-xs font-semibold hover:bg-[#F2D9AC]">QCM</Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </StudyShell>
  );
}
export default function CourseDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-[#684F48]">
          Chargement du cours...
        </div>
      }
    >
      <CourseDetailsContent />
    </Suspense>
  );
}