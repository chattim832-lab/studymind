"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import StudyShell, { apiRequest, getId } from "../_components/StudyShell";

export default function ChatPage() {
  const initialPdf = useRef("");
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [pdfId, setPdfId] = useState("");
  const [scope, setScope] = useState("pdf");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function initialize() {
      try {
        const data = await apiRequest("/courses");
        if (!alive) return;
        const list = Array.isArray(data) ? data : data.courses || [];
        setCourses(list);
        const params = new URLSearchParams(window.location.search);
        const wantedId = params.get("course_id") || "";
        initialPdf.current = params.get("pdf_id") || "";
        setScope(params.get("scope") === "course" ? "course" : "pdf");
        if (list.some((item) => getId(item) === wantedId)) setCourseId(wantedId);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoadingCourses(false);
      }
    }
    initialize();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!courseId) { setPdfs([]); setPdfId(""); return; }
    let alive = true;
    async function loadPdfs() {
      setLoadingPdfs(true);
      try {
        const data = await apiRequest("/courses/" + encodeURIComponent(courseId) + "/pdfs");
        if (!alive) return;
        const list = Array.isArray(data) ? data : data.pdfs || [];
        setPdfs(list);
        const selected = list.some((pdf) => getId(pdf) === initialPdf.current) ? initialPdf.current : "";
        setPdfId(selected);
        initialPdf.current = "";
      } catch (err) { if (alive) setError(err.message); }
      finally { if (alive) setLoadingPdfs(false); }
    }
    loadPdfs();
    return () => { alive = false; };
  }, [courseId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!courseId || (scope === "pdf" && !pdfId)) { setError("Choisis un cours et, pour le mode PDF, un document."); return; }
    if (!question.trim()) { setError("Écris une question."); return; }
    setSending(true); setError(""); setResult(null);
    try {
      const path = scope === "course" ? "/chat/course" : "/chat";
      const body = scope === "course" ? { course_id: courseId, question: question.trim() } : { course_id: courseId, pdf_id: pdfId, question: question.trim() };
      const data = await apiRequest(path, { method: "POST", body });
      setResult(data);
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  }

  const sources = Array.isArray(result?.sources) ? result.sources : [];
  const sourcePages = Array.isArray(result?.source_pages) ? result.source_pages : [];

  return (
    <StudyShell>
      <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#93A8AD]">YOUR AI STUDY ASSISTANT</p><h1 className="mt-2 font-serif text-4xl">Chatbot IA</h1><p className="mt-2 text-sm text-[#806F68]">Discute avec un seul PDF ou tout un cours.</p></header>
      <section className="mb-7 overflow-hidden rounded-[26px] bg-[#D6E9ED] p-7 md:p-9"><p className="text-xs uppercase tracking-widest text-[#708F93]">StudyMind Intelligence</p><h2 className="mt-2 font-serif text-3xl">Ask, learn & understand.</h2><p className="mt-2 text-sm text-[#806F68]">Réponses personnalisées à partir de tes documents.</p></section>
      <section className="rounded-[26px] border border-[#DCE8E6] bg-white p-6 shadow-sm md:p-8">
        <h2 className="mb-6 font-serif text-2xl">Pose ta question</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><p className="mb-3 text-sm font-semibold">Mode de discussion</p><div className="grid gap-3 sm:grid-cols-2">
            {[{id:"pdf",title:"Un seul PDF",desc:"Interroger un document"},{id:"course",title:"Tout le cours",desc:"Interroger tous les PDF du cours"}].map((mode) => <button key={mode.id} type="button" aria-pressed={scope === mode.id} onClick={() => {setScope(mode.id);setResult(null);setError("");}} className={"rounded-2xl border p-4 text-left transition " + (scope === mode.id ? "border-[#684F48] bg-[#F9E7C7]" : "border-[#DCE8E6] bg-[#F4FAF9]")}><span className="block font-semibold">{mode.title}</span><span className="mt-1 block text-xs text-[#806F68]">{mode.desc}</span></button>)}
          </div></div>
          <div className="grid gap-4 md:grid-cols-2"><label className="block text-sm font-semibold">Cours<select value={courseId} onChange={(event) => {setCourseId(event.target.value);setPdfId("");setPdfs([]);setResult(null);}} disabled={loadingCourses || sending} className="mt-2 block w-full rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 font-normal"><option value="">Choisir un cours</option>{courses.map((course) => <option key={getId(course)} value={getId(course)}>{course.title || course.name}</option>)}</select></label>
            <label className="block text-sm font-semibold">Document PDF<select value={pdfId} onChange={(event) => {setPdfId(event.target.value);setResult(null);}} disabled={scope === "course" || !courseId || loadingPdfs || sending} className="mt-2 block w-full rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 font-normal"><option value="">{scope === "course" ? "Tous les PDF" : loadingPdfs ? "Chargement..." : "Choisir un PDF"}</option>{pdfs.map((pdf) => <option key={getId(pdf)} value={getId(pdf)}>{pdf.filename}</option>)}</select></label></div>
          <label className="block text-sm font-semibold">Ta question<textarea rows={4} value={question} onChange={(event) => setQuestion(event.target.value)} disabled={sending} placeholder="Par exemple : explique-moi les concepts principaux de ce document..." className="mt-2 block w-full resize-y rounded-2xl border border-[#DCE8E6] bg-[#FFFDF8] p-4 font-normal outline-[#93A8AD]"/></label>
          {error && <p role="alert" className="rounded-xl bg-[#F9E7C7] p-4 text-sm">{error}</p>}
          <button type="submit" disabled={sending || !courseId || (scope === "pdf" && !pdfId) || !question.trim()} className="rounded-full bg-[#684F48] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8B6F66] disabled:opacity-50">{sending ? "Gemini réfléchit..." : "Envoyer ma question ↗"}</button>
        </form>
      </section>
      {result && <section className="mt-7 rounded-[26px] border border-[#DCE8E6] bg-[#F4FAF9] p-6 md:p-8"><h2 className="font-serif text-2xl">Réponse de StudyMind</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-8">{result.answer || "Aucune réponse."}</p>{(sources.length > 0 || sourcePages.length > 0) && <div className="mt-6 border-t border-[#DCE8E6] pt-4"><p className="text-sm font-semibold">Sources</p><div className="mt-2 flex flex-wrap gap-2">{sources.map((s,index) => <span key={index} className="rounded-full bg-white px-3 py-2 text-xs">{s.filename || "PDF"} · page {s.page}</span>)}{sources.length === 0 && sourcePages.map((page,index) => <span key={index} className="rounded-full bg-white px-3 py-2 text-xs">Page {typeof page === "object" ? page.page : page}</span>)}</div></div>}</section>}
      <p className="mt-5 text-xs text-[#806F68]">Les réponses IA doivent être vérifiées dans les documents originaux. <Link href="/revision" className="underline underline-offset-4">Continuer en révision</Link></p>
    </StudyShell>
  );
}
