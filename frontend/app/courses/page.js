"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StudyShell, { apiRequest, getId } from "../_components/StudyShell";
import CourseFolder from "../_components/CourseFolder";

function formatSize(bytes) {
  if (typeof bytes !== "number") return "";
  return bytes < 1024 ? bytes + " o" : (bytes / 1048576).toFixed(2) + " Mo";
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expandedId, setExpandedId] = useState("");
  const [pdfsByCourse, setPdfsByCourse] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiRequest("/courses");
        if (active) setCourses(Array.isArray(data) ? data : data.courses || []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => courses.filter((course) => String(course.title || course.name || "").toLowerCase().includes(search.toLowerCase())), [courses, search]);

  async function refreshPdfs(id) {
    const data = await apiRequest("/courses/" + encodeURIComponent(id) + "/pdfs");
    setPdfsByCourse((previous) => ({ ...previous, [id]: Array.isArray(data) ? data : data.pdfs || [] }));
  }

  async function togglePdfs(id) {
    setError("");
    if (expandedId === id) { setExpandedId(""); return; }
    setExpandedId(id);
    if (Object.prototype.hasOwnProperty.call(pdfsByCourse, id)) return;
    setBusyId(id);
    try { await refreshPdfs(id); } catch (err) { setError(err.message); }
    finally { setBusyId(""); }
  }

  async function handleUpload(event, id) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = selectedFiles[id];
    if (!file) { setError("Sélectionne un PDF d'abord."); return; }
    if (!file.name.toLowerCase().endsWith(".pdf") || file.size > 10 * 1048576) {
      setError("Choisis un PDF de 10 Mo maximum."); return;
    }
    const body = new FormData();
    body.append("file", file);
    setBusyId(id); setError(""); setNotice("");
    try {
      await apiRequest("/courses/" + encodeURIComponent(id) + "/pdfs", { method: "POST", body });
      await refreshPdfs(id);
      setSelectedFiles((previous) => ({ ...previous, [id]: null }));
      form.reset();
      setNotice("PDF ajouté avec succès.");
    } catch (err) { setError(err.message); }
    finally { setBusyId(""); }
  }

  // Supprimer un PDF d'un cours sans supprimer le cours lui-meme.
  async function handleDeletePdf(courseId, pdf) {
    const pdfId = getId(pdf);
    if (!window.confirm("Supprimer le PDF « " + (pdf.filename || "Document") + " » ?")) return;
    setBusyId(courseId);
    setError("");
    setNotice("");
    try {
      await apiRequest(
        "/courses/" + encodeURIComponent(courseId) + "/pdfs/" + encodeURIComponent(pdfId),
        { method: "DELETE" }
      );
      setPdfsByCourse((previous) => ({
        ...previous,
        [courseId]: (previous[courseId] || []).filter((item) => getId(item) !== pdfId),
      }));
      setNotice("PDF supprimé avec succès.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Supprimer ce cours et tous ses PDF définitivement ?")) return;
    setBusyId(id); setError(""); setNotice("");
    try {
      await apiRequest("/courses/" + encodeURIComponent(id), { method: "DELETE" });
      setCourses((previous) => previous.filter((course) => getId(course) !== id));
      if (expandedId === id) setExpandedId("");
      setNotice("Cours supprimé avec succès.");
    } catch (err) { setError(err.message); }
    finally { setBusyId(""); }
  }

  return (
    <StudyShell>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[.21em] text-[#93A8AD]">YOUR LIBRARY</p><h1 className="mt-1 font-serif text-4xl">Mes cours</h1><p className="mt-2 text-sm text-[#917F73]">Tous tes cours, rangés dans de jolis dossiers.</p></div>
        <Link href="/courses/new" className="rounded-full bg-[#684F48] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8B6F66]">+ Nouveau cours</Link>
      </header>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E1E9E6] bg-[#F4FAF9] px-5 py-4">
        <p className="font-serif text-xl">{loading ? "…" : courses.length} <span className="text-sm text-[#7B9295]">cours enregistrés</span></p>
        <label className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm"><span className="text-[#93A8AD]">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un cours" className="w-40 bg-transparent text-sm outline-none sm:w-56"/></label>
      </div>
      {error && <p role="alert" className="mb-5 rounded-xl bg-[#F9E7C7] p-4 text-sm">{error}</p>}
      {notice && <p role="status" className="mb-5 rounded-xl bg-[#D6E9ED] p-4 text-sm">{notice}</p>}
      {loading ? <p>Chargement des cours…</p> : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#93A8AD] bg-white p-10 text-center"><p>{search ? "Aucun cours trouvé." : "Tu n'as pas encore de cours."}</p><Link href="/courses/new" className="mt-4 inline-block rounded-full bg-[#684F48] px-5 py-3 text-sm text-white">Ajouter un cours</Link></div>
      ) : (
        <div className="grid items-start gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((course, index) => {
            const id = getId(course);
            const open = expandedId === id;
            const pdfs = pdfsByCourse[id] || [];
            return (
              <article key={id} className="min-w-0">
                {/* Whole illustrated folder navigates to this course. */}
                <CourseFolder course={course} index={index}/>
                <div className="mt-3 flex flex-wrap gap-2 px-1">
                  <button type="button" aria-expanded={open} onClick={() => togglePdfs(id)} disabled={Boolean(busyId)} className="rounded-full border border-[#C8D8D9] bg-[#D6E9ED] px-3 py-2 text-[11px] font-semibold hover:bg-[#C8DDE1] disabled:opacity-60">{open ? "Masquer PDF" : "Voir les PDF"}</button>
                  <button type="button" onClick={() => handleDelete(id)} disabled={Boolean(busyId)} className="rounded-full border border-[#E6D1C9] bg-white px-3 py-2 text-[11px] text-[#684F48] hover:bg-[#F9E7C7] disabled:opacity-60">Supprimer</button>
                </div>
                {open && <div className="mt-3 space-y-4 rounded-2xl border border-[#DFE8E5] bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#93A8AD]">Documents PDF</p>
                  {busyId === id && !Object.prototype.hasOwnProperty.call(pdfsByCourse, id) ? <p className="text-xs">Chargement…</p> : pdfs.length === 0 ? <p className="text-xs text-[#8F8173]">Aucun PDF pour le moment.</p> : (
                    <ul className="space-y-3">
                      {pdfs.map((pdf) => {
                        const pdfId = getId(pdf);
                        const chatLink = "/chat?course_id=" + encodeURIComponent(id) + "&pdf_id=" + encodeURIComponent(pdfId);
                        return (
                          <li key={pdfId} className="rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 text-xs">
                            <p className="break-words font-semibold">📄 {pdf.filename || "Document.pdf"}</p>
                            <p className="mt-1 text-[11px] text-[#93A8AD]">{formatSize(pdf.size_bytes)}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Link href={chatLink} className="rounded-full bg-[#684F48] px-3 py-2 font-semibold text-white hover:bg-[#80645A]">Chatbot PDF</Link>
                              <Link href={"/revision?course_id=" + encodeURIComponent(id) + "&pdf_id=" + encodeURIComponent(pdfId) + "&tab=summary"} className="rounded-full bg-[#D6E9ED] px-3 py-2 font-semibold">Résumé</Link>
                              <Link href={"/revision?course_id=" + encodeURIComponent(id) + "&pdf_id=" + encodeURIComponent(pdfId) + "&tab=sheet"} className="rounded-full bg-[#D6E9ED] px-3 py-2 font-semibold">Fiche</Link>
                              <Link href={"/revision?course_id=" + encodeURIComponent(id) + "&pdf_id=" + encodeURIComponent(pdfId) + "&tab=quiz"} className="rounded-full bg-[#F9E7C7] px-3 py-2 font-semibold">QCM</Link>
                              <button type="button" disabled={Boolean(busyId)} onClick={() => handleDeletePdf(id, pdf)} className="rounded-full border border-[#CDAFA2] bg-white px-3 py-2 font-semibold text-[#684F48] hover:bg-[#F9E7C7] disabled:opacity-50">Supprimer PDF</button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <form onSubmit={(event) => handleUpload(event, id)} className="space-y-2">
                    <label className="block text-xs font-semibold" htmlFor={"pdf-" + id}>Ajouter un PDF (10 Mo max)</label>
                    <input id={"pdf-" + id} type="file" accept=".pdf,application/pdf" onChange={(event) => setSelectedFiles((old) => ({ ...old, [id]: event.target.files?.[0] || null }))} className="block w-full text-[11px] file:mr-2 file:rounded-full file:border-0 file:bg-[#D6E9ED] file:px-3 file:py-2"/>
                    <button type="submit" disabled={Boolean(busyId)} className="w-full rounded-xl bg-[#684F48] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{busyId === id ? "En cours…" : "Ajouter ce PDF"}</button>
                  </form>
                  <Link href={"/courses/" + encodeURIComponent(id)} className="block text-center text-xs font-semibold underline underline-offset-4">Voir tous les outils du cours</Link>
                </div>}
              </article>
            );
          })}
        </div>
      )}
    </StudyShell>
  );
}