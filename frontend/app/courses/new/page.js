"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StudyShell, { apiRequest } from "../../_components/StudyShell";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) { setError("Le titre du cours est obligatoire."); return; }
    setLoading(true); setError("");
    try {
      await apiRequest("/courses", { method: "POST", body: { title: title.trim(), description: description.trim() } });
      router.push("/courses");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <StudyShell>
      <Link href="/courses" className="mb-6 inline-block text-sm text-[#806F68] hover:underline">← Retour à mes cours</Link>
      <p className="text-xs uppercase tracking-[.2em] text-[#93A8AD]">YOUR LIBRARY</p>
      <h1 className="mt-1 font-serif text-4xl">Nouveau cours</h1>
      <p className="mt-3 text-sm text-[#806F68]">Crée un espace pour tes PDF et tes révisions.</p>
      <form onSubmit={handleSubmit} className="mt-8 max-w-2xl space-y-6 rounded-[26px] border border-[#DCE8E6] bg-white p-6 shadow-sm md:p-9">
        <label className="block text-sm font-semibold">Nom du cours<input value={title} onChange={(event) => setTitle(event.target.value)} disabled={loading} maxLength={150} placeholder="Ex : Big Data" className="mt-2 block w-full rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 font-normal outline-[#93A8AD]" required/></label>
        <label className="block text-sm font-semibold">Description (facultative)<textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={loading} rows={5} placeholder="Décris brièvement ce cours..." className="mt-2 block w-full resize-y rounded-xl border border-[#DCE8E6] bg-[#FFFDF8] p-3 font-normal outline-[#93A8AD]"/></label>
        {error && <p role="alert" className="rounded-xl bg-[#F9E7C7] p-4 text-sm">{error}</p>}
        <div className="flex flex-wrap gap-3"><button type="submit" disabled={loading} className="rounded-full bg-[#684F48] px-6 py-3 text-sm font-semibold text-white hover:bg-[#8B6F66] disabled:opacity-50">{loading ? "Création..." : "Créer le cours"}</button><Link href="/courses" className="rounded-full border border-[#DCE8E6] px-6 py-3 text-sm">Annuler</Link></div>
      </form>
    </StudyShell>
  );
}
