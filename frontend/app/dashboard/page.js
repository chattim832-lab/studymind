"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import StudyShell, { apiRequest, getId } from "../_components/StudyShell";

const COVERS = [
  "linear-gradient(135deg, #CD9FA0, #F2C1A3)",
  "linear-gradient(135deg, #857C91, #CD9FA0)",
  "linear-gradient(135deg, #F2C1A3, #F8CCAA)",
  "linear-gradient(135deg, #525871, #857C91)",
];

export default function DashboardPage() {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const data = await apiRequest("/courses");

        if (active) {
          setCourses(
            Array.isArray(data) ? data : data.courses || []
          );
        }

        // Le Dashboard reste accessible meme si
        // le Backend Progression n'est pas encore cree.
        try {
          const stats = await apiRequest("/study/progress");

          if (active) {
            setProgress(stats);
          }
        } catch {
          if (active) {
            setProgress(null);
          }
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

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) =>
      String(course.title || course.name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [courses, search]);

  return (
    <StudyShell>
      {/* HEADER */}
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2
            className="text-4xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Dashboard
          </h2>

          <p className="mt-2 text-sm text-[#857C91]">
            Bienvenue dans ton espace StudyMind ♡
          </p>
        </div>

        {/* RECHERCHE */}
        <label className="flex items-center gap-3 rounded-full border border-[#E8DADD] bg-white px-4 py-3 shadow-sm">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher un cours..."
            className="w-44 bg-transparent text-sm outline-none placeholder:text-[#AFA3AD] sm:w-56"
          />
        </label>
      </header>

      {/* BANNIERE */}
      <section
        className="relative mb-8 overflow-hidden rounded-3xl p-7 text-white shadow-sm md:p-9"
        style={{
          background:
            "linear-gradient(115deg, #525871 0%, #857C91 60%, #CD9FA0 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[25px] border-white/10"
        />

        <div className="relative">
          <p className="mb-3 text-xs uppercase tracking-widest text-white/70">
            StudyMind Workspace
          </p>

          <h3
            className="max-w-xl text-3xl md:text-4xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Make studying feel easier.
          </h3>

          <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
            Organise tes PDF, génère tes fiches de révision
            et entraîne-toi avec des QCM.
          </p>

          <Link
            href="/revision"
            className="mt-6 inline-flex rounded-full bg-[#F8CCAA] px-5 py-3 text-sm font-semibold text-[#525871] hover:bg-white"
          >
            Commencer une révision →
          </Link>
        </div>
      </section>

      {/* STATISTIQUES */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* NOMBRE DE COURS */}
        <div className="rounded-2xl border border-[#E8DADD] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#857C91]">
            Mes cours
          </p>

          <p
            className="mt-3 text-4xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {loading ? "..." : courses.length}
          </p>

          <p className="mt-2 text-xs text-[#A38E98]">
            Cours disponibles
          </p>
        </div>

        {/* QCM REALISES */}
        <div className="rounded-2xl border border-[#E8DADD] bg-[#F5E3E0] p-5 shadow-sm">
          <p className="text-sm text-[#857C91]">
            QCM réalisés
          </p>

          <p
            className="mt-3 text-4xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {progress ? progress.total_quizzes : "—"}
          </p>

          <p className="mt-2 text-xs text-[#A38E98]">
            Résultats enregistrés
          </p>
        </div>

        {/* SCORE MOYEN */}
        <div className="rounded-2xl border border-[#E8DADD] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#857C91]">
            Score moyen
          </p>

          <p
            className="mt-3 text-4xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {progress
              ? Math.round(progress.average_percentage || 0) + "%"
              : "—"}
          </p>

          <p className="mt-2 text-xs text-[#A38E98]">
            Selon les QCM terminés
          </p>
        </div>

        {/* PROGRESSION */}
        <Link
          href="/progress"
          className="rounded-2xl border border-[#E8DADD] bg-[#E6D8DF] p-5 shadow-sm transition hover:shadow-md"
        >
          <p className="text-sm text-[#857C91]">
            Ma progression
          </p>

          <p
            className="mt-3 text-xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Voir mes résultats ↗️
          </p>

          <p className="mt-3 text-xs text-[#A38E98]">
            Scores et points à réviser
          </p>
        </Link>
      </div>

      {/* TITRE DES COURS */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3
          className="text-2xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Mes cours
        </h3>

        <Link
          href="/courses"
          className="text-sm font-medium text-[#857C91] hover:underline"
        >
          Voir tous les cours →
        </Link>
      </div>

      {/* MESSAGE ERREUR */}
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-[#F7E2E2] p-4 text-sm text-[#8A3F48]"
        >
          {error}
        </p>
      )}

      {/* LISTE DES COURS */}
      {loading ? (
        <p className="text-sm text-[#857C91]">
          Chargement des cours...
        </p>
      ) : filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#CD9FA0] bg-white p-8 text-center">
          <p>Aucun cours à afficher.</p>

          <Link
            href="/courses/new"
            className="mt-4 inline-block rounded-full bg-[#525871] px-5 py-3 text-sm text-white"
          >
            Ajouter un cours
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course, index) => {
            const id = getId(course);

            const title =
              course.title ||
              course.name ||
              "Cours sans titre";

            return (
              <Link
                key={id}
                href={
                  "/courses/" + encodeURIComponent(id)
                }
                aria-label={"Accéder au cours " + title}
                className="block cursor-pointer overflow-hidden rounded-2xl border border-[#E8DADD] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#525871]"
              >
                {/* COUVERTURE DU COURS */}
                <div
                  className="relative h-36 overflow-hidden p-5"
                  style={{
                    background:
                      COVERS[index % COVERS.length],
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute -right-8 -top-10 h-40 w-40 rounded-full border-[16px] border-white/20"
                  />

                  <span className="relative rounded-full bg-white/70 px-3 py-1 text-xs text-[#525871]">
                    StudyMind
                  </span>
                </div>

                {/* INFORMATIONS DU COURS */}
                <div className="p-5">
                  <h4
                    className="text-xl"
                    style={{
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {title}
                  </h4>

                  {course.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-[#857C91]">
                      {course.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ACTIONS RAPIDES */}
      <div className="mt-9 grid gap-4 sm:grid-cols-3">

        {/* AJOUTER UN COURS */}
        <Link
          href="/courses/new"
          className="rounded-2xl bg-[#F2C1A3] p-6 hover:opacity-90"
        >
          <p className="text-sm text-[#525871]/70">
            Organisation
          </p>

          <h4
            className="mt-2 text-xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            + Ajouter un cours
          </h4>
        </Link>

        {/* CHATBOT IA */}
        <Link
          href="/chat"
          className="rounded-2xl bg-[#E6D8DF] p-6 hover:opacity-90"
        >
          <p className="text-sm text-[#525871]/70">
            Assistant IA
          </p>

          <h4
            className="mt-2 text-xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            ✦ Poser une question
          </h4>
        </Link>

        {/* REVISION */}
        <Link
          href="/revision"
          className="rounded-2xl bg-[#F8CCAA] p-6 hover:opacity-90"
        >
          <p className="text-sm text-[#525871]/70">
            Révision intelligente
          </p>

          <h4
            className="mt-2 text-xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            ✎ Résumé, fiche et QCM
          </h4>
        </Link>

      </div>
    </StudyShell>
  );
}