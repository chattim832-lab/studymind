"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8001";

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

      {name === "arrow" && (
        <path d="m15 18-6-6 6-6" />
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

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Verifier si l'etudiant est connecte
  useEffect(() => {
    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // Creer un cours
  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Le titre du cours est obligatoire.");
      return;
    }

    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL + "/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Impossible de créer le cours."
        );
      }

      router.push("/courses");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Deconnexion
  function handleLogout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

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
            Chaque nouveau cours est un pas vers la réussite.
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

      {/* CONTENU */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">

        {/* RETOUR */}
        <Link
          href="/courses"
          className="mb-7 inline-flex items-center gap-2 text-sm text-[#857C91] hover:text-[#525871]"
        >
          <Icon name="arrow" />
          Retour à mes cours
        </Link>

        {/* EN-TETE */}
        <div className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#CD9FA0]">
            ORGANISATION
          </p>

          <h2
            className="text-4xl md:text-5xl"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Ajouter un cours
          </h2>

          <p className="mt-3 text-sm text-[#857C91]">
            Crée un nouvel espace pour organiser tes documents.
          </p>
        </div>

        {/* BANNIERE */}
        <section
          className="relative mb-8 overflow-hidden rounded-3xl p-7 text-white"
          style={{
            background:
              "linear-gradient(115deg, #525871 0%, #857C91 55%, #CD9FA0 100%)",
          }}
        >
          <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full border-[20px] border-white/10" />

          <div className="relative">
            <p className="mb-2 text-xs uppercase tracking-widest text-white/70">
              NEW BEGINNING
            </p>

            <h3
              className="text-3xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              One course at a time ♡
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">
              Organise tes matières, ajoute tes PDF et révise
              plus facilement avec StudyMind.
            </p>
          </div>
        </section>

        {/* FORMULAIRE */}
        <section className="mx-auto max-w-2xl rounded-3xl border border-[#E8DADD] bg-white p-6 shadow-sm md:p-9">

          <div className="mb-7">
            <h3
              className="text-2xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Informations du cours
            </h3>

            <p className="mt-2 text-sm text-[#857C91]">
              Remplis les informations ci-dessous.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* TITRE */}
            <div>
              <label
                htmlFor="course-title"
                className="mb-2 block text-sm font-semibold"
              >
                Nom du cours *
              </label>

              <input
                id="course-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Exemple : Big Data"
                maxLength={120}
                required
                className="w-full rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm text-[#525871] outline-none transition placeholder:text-[#AFA3AD] focus:border-[#CD9FA0] focus:ring-2 focus:ring-[#CD9FA0]/20"
              />

              <p className="mt-2 text-right text-xs text-[#A38E98]">
                {title.length}/120 caractères
              </p>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                htmlFor="course-description"
                className="mb-2 block text-sm font-semibold"
              >
                Description
              </label>

              <textarea
                id="course-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Exemple : Cours sur Hadoop, MapReduce et les technologies Big Data."
                rows={5}
                maxLength={1000}
                className="w-full resize-y rounded-xl border border-[#E8DADD] bg-[#FAF6F4] px-4 py-3 text-sm text-[#525871] outline-none transition placeholder:text-[#AFA3AD] focus:border-[#CD9FA0] focus:ring-2 focus:ring-[#CD9FA0]/20"
              />

              <p className="mt-2 text-right text-xs text-[#A38E98]">
                {description.length}/1000 caractères
              </p>
            </div>

            {/* ERREUR */}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-[#F7E2E2] p-4 text-sm text-[#8A3F48]"
              >
                {error}
              </p>
            )}

            {/* BOUTONS */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[#F0E8E8] pt-6">

              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="rounded-full bg-[#525871] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#857C91] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Création en cours..."
                  : "Créer le cours"}
              </button>

              <Link
                href="/courses"
                className="rounded-full border border-[#E8DADD] bg-white px-6 py-3 text-sm font-medium text-[#857C91] transition hover:bg-[#FAF6F4]"
              >
                Annuler
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}