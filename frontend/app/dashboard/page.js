"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StudyShell, { apiRequest } from "../_components/StudyShell";
import CourseFolder from "../_components/CourseFolder";

function toPercent(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

function ProgressSidebar({ progress, loading }) {
  const total = Number(progress?.total_quizzes) || 0;
  const average = toPercent(progress?.average_percentage);
  const best = toPercent(progress?.best_percentage);
  const weak = Array.isArray(progress?.weak_points) ? progress.weak_points : [];
  const recent = Array.isArray(progress?.history) ? progress.history.slice(0, 3) : [];

  return (
    <aside id="progression" aria-label="Suivi de progression" className="min-w-0 space-y-5 xl:sticky xl:top-8 xl:self-start">
      <section className="rounded-[26px] border border-[#DCE8E6] bg-[#F4FAF9] p-5 shadow-[0_6px_24px_rgba(104,79,72,0.04)]">
        <div className="mb-5 flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.19em] text-[#788F93]">Your progress</p>
            <h2 className="mt-1 font-serif text-2xl">Progression</h2>
          </div>
          <span aria-hidden="true" className="rounded-full bg-[#D6E9ED] px-2.5 py-1 text-[#684F48]">✦</span>
        </div>

        <div className="mx-auto mb-6 grid h-40 w-40 place-items-center rounded-full" style={{ background: "conic-gradient(#684F48 " + average + "%,#93A8AD " + average + "%,#D6E9ED 0)" }}>
          <div className="flex h-[126px] w-[126px] flex-col items-center justify-center rounded-full bg-[#F4FAF9] text-center">
            <strong className="font-serif text-[35px] leading-none">{loading ? "…" : total ? average + "%" : "0%"}</strong>
            <span className="mt-1 text-[11px] text-[#82999C]">score moyen</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-[#DDE9E7] pt-4 text-center">
          <div><p className="font-serif text-2xl">{loading ? "…" : total}</p><p className="text-[11px] text-[#87979A]">QCM réalisés</p></div>
          <div><p className="font-serif text-2xl">{loading ? "…" : best + "%"}</p><p className="text-[11px] text-[#87979A]">Meilleur score</p></div>
        </div>
      </section>

      <section className="rounded-[26px] border border-[#E8E0D3] bg-[#FFF8EB] p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-serif text-xl">À réviser</h3><span className="text-[#93A8AD]">☷</span></div>
        {weak.length === 0 ? (
          <p className="text-sm leading-6 text-[#8F8173]">{total ? "Aucun point faible identifié pour le moment." : "Termine un QCM pour découvrir les notions à retravailler."}</p>
        ) : (
          <ul className="space-y-3">
            {weak.slice(0, 4).map((item, index) => {
              const topic = typeof item === "string" ? item : item.topic;
              return <li key={index} className="flex gap-2.5 text-sm leading-5"><span className="mt-0.5 text-[#93A8AD]">□</span><span className="break-words">{topic}</span></li>;
            })}
          </ul>
        )}
        <Link href="/revision?tab=quiz" className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#684F48] px-4 py-2.5 text-xs font-semibold text-[#FFF8EB] transition hover:bg-[#8B6F66]">Faire un QCM</Link>
      </section>

      <section className="rounded-[26px] border border-[#DCE8E6] bg-white p-5">
        <h3 className="font-serif text-xl">Activité récente</h3>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-[#8F8173]">Tes résultats apparaîtront ici après ton premier QCM.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {recent.map((attempt, index) => <li key={attempt.id || index} className="flex items-center justify-between gap-2 border-b border-[#F2EBDD] pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-xs font-semibold">{attempt.course_title || "Cours"}</p><p className="mt-1 text-[11px] text-[#8F8173]">{attempt.total} questions</p></div><span className="shrink-0 rounded-full bg-[#D6E9ED] px-2.5 py-1 text-xs font-bold">{toPercent(attempt.percentage)}%</span></li>)}
          </ul>
        )}
      </section>
    </aside>
  );
}

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function initialize() {
      try {
        const data = await apiRequest("/courses");
        if (alive) setCourses(Array.isArray(data) ? data : data.courses || []);
      } catch (err) {
        if (alive) setError(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    async function getStats() {
      try {
        const data = await apiRequest("/study/progress");
        if (alive) setProgress(data);
      } catch {
        if (alive) setProgress(null);
      }
    }
    initialize();
    getStats();
    return () => { alive = false; };
  }, []);

  const filteredCourses = useMemo(() => courses.filter((course) => String(course.title || course.name || "").toLowerCase().includes(search.toLowerCase())), [courses, search]);

  return (
    <StudyShell>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.25em] text-[#93A8AD]">Your study space</p><h1 className="mt-1 font-serif text-4xl md:text-[42px]">Dashboard</h1></div>
        <label className="flex items-center gap-3 rounded-full border border-[#DCE8E6] bg-white px-4 py-3 shadow-sm"><span aria-hidden="true" className="text-[#93A8AD]">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un cours" className="w-40 bg-transparent text-sm outline-none placeholder:text-[#A39B94] sm:w-52"/></label>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_268px]">
        <div className="min-w-0">
          {/* Date-free Paris rooftop watercolor created for the banner. */}
          <section className="relative mb-8 flex min-h-[245px] items-end overflow-hidden rounded-[27px] border border-[#E6E9E2] bg-[#D6E9ED] shadow-[0_8px_28px_rgba(104,79,72,0.05)]" style={{ backgroundImage: "linear-gradient(90deg,rgba(249,231,199,.94),rgba(249,231,199,.81) 33%,rgba(249,231,199,.02) 72%),url('/studymind/banner-paris.png')", backgroundSize: "cover", backgroundPosition: "center 56%" }}>
            <div className="relative max-w-[420px] p-7 md:p-9">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[.22em] text-[#87766F]">STUDYMIND · YOUR STUDY SPACE</p>
              <h2 className="font-serif text-[29px] leading-tight text-[#684F48] md:text-[35px]">A little progress<br/>every day.</h2>
              <p className="mt-3 max-w-[300px] text-xs leading-5 text-[#684F48]/80">Tes cours, tes fiches et ton assistant IA au même endroit.</p>
              <Link href="/revision" className="mt-4 inline-flex rounded-full bg-[#684F48] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#8B6F66]">Commencer à réviser ↗</Link>
            </div>
          </section>

          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[.18em] text-[#93A8AD]">MY LIBRARY</p><h2 className="mt-1 font-serif text-3xl">Mes cours <span className="ml-1 text-lg text-[#93A8AD]">({loading ? "…" : courses.length})</span></h2></div>
            <div className="flex items-center gap-4"><Link href="/courses/new" className="text-xs font-semibold text-[#684F48] underline decoration-[#93A8AD] underline-offset-4">+ Nouveau cours</Link><Link href="/courses" className="text-xs font-semibold text-[#684F48] underline decoration-[#93A8AD] underline-offset-4">Voir tous ↗</Link></div>
          </div>
          {error && <p role="alert" className="mb-5 rounded-xl bg-[#F9E7C7] p-4 text-sm">{error}</p>}
          {loading ? <p className="text-sm text-[#8F8173]">Chargement des cours...</p> : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#93A8AD] bg-white p-8 text-center"><p className="text-sm">{search ? "Aucun cours ne correspond à la recherche." : "Aucun cours pour le moment."}</p><Link href="/courses/new" className="mt-4 inline-block rounded-full bg-[#684F48] px-4 py-2.5 text-sm text-white">Ajouter un cours</Link></div>
          ) : <div className="grid gap-x-4 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">{filteredCourses.map((course, index) => <CourseFolder key={course.id || course._id || index} course={course} index={index}/>)}</div>}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Link href="/chat" className="rounded-[22px] bg-[#D6E9ED] p-5 transition hover:-translate-y-1"><p className="text-xs uppercase tracking-[.16em] text-[#6D898D]">AI ASSISTANT</p><h3 className="mt-2 font-serif text-xl">✦ Poser une question</h3><p className="mt-1 text-xs text-[#7F8C8E]">Discute avec tes PDF.</p></Link>
            <Link href="/revision" className="rounded-[22px] bg-[#F9E7C7] p-5 transition hover:-translate-y-1"><p className="text-xs uppercase tracking-[.16em] text-[#8D756B]">REVISION</p><h3 className="mt-2 font-serif text-xl">✎ Résumé, fiche & QCM</h3><p className="mt-1 text-xs text-[#8F8173]">Apprends à ton rythme.</p></Link>
          </div>
        </div>
        {/* Progression belongs to the right-hand side, not its own page. */}
        <ProgressSidebar progress={progress} loading={loading}/>
      </div>
    </StudyShell>
  );
}