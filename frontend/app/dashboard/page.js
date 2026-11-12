"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = "http://127.0.0.1:8001";

const COLORS = [
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
      {name === "home" && (
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
      <span>{children}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger les cours depuis FastAPI
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

  // Rechercher un cours
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const name = course.title || course.name || "";
      return name.toLowerCase().includes(search.toLowerCase());
    });
  }, [courses, search]);

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
          <MenuLink href="/dashboard" icon="home" active>
            Dashboard
          </MenuLink>

          <MenuLink href="/courses" icon="book">
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
            Organise tes cours et révise avec ton assistant IA.
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

        {/* TOP BAR */}
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

          <div className="flex items-center gap-3 rounded-full border border-[#E8DADD] bg-white px-4 py-3 shadow-sm">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un cours..."
              className="w-40 bg-transparent text-sm outline-none placeholder:text-[#AFA3AD] sm:w-52"
            />
          </div>
        </header>

        {/* BANNIERE */}
        <section
          className="relative mb-8 overflow-hidden rounded-3xl p-7 text-white shadow-sm md:p-9"
          style={{
            background:
              "linear-gradient(115deg, #525871 0%, #857C91 60%, #CD9FA0 100%)",
          }}
        >
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[25px] border-white/10" />
          <div className="absolute bottom-0 right-20 h-24 w-24 rounded-full bg-white/10 blur-xl" />

          <div className="relative">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/70">
              StudyMind Workspace
            </p>

            <h3
              className="max-w-xl text-3xl md:text-4xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Make studying feel easier.
            </h3>

            <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
              Retrouve tes cours, organise tes PDF et pose tes questions
              à ton chatbot intelligent.
            </p>

            <Link
              href="/chat"
              className="mt-6 inline-flex rounded-full bg-[#F8CCAA] px-5 py-3 text-sm font-semibold text-[#525871] transition hover:bg-white"
            >
              Parler au Chatbot IA →
            </Link>
          </div>
        </section>

        {/* STATISTIQUES */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">

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

          <div className="rounded-2xl border border-[#E8DADD] bg-[#F5E3E0] p-5 shadow-sm">
            <p className="text-sm text-[#857C91]">
              Chatbot IA
            </p>

            <p
              className="mt-3 text-2xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Français & English
            </p>

            <p className="mt-2 text-xs text-[#A38E98]">
              Réponses avec pages sources
            </p>
          </div>
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

        {/* ERREUR */}
        {error && (
          <p className="mb-5 rounded-xl bg-[#F7E2E2] p-4 text-sm text-[#8A3F48]">
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
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course, index) => {
              const title =
                course.title || course.name || "Cours sans titre";

              const id = course.id || course._id || index;

              return (
                <Link
                  href="/courses"
                  key={id}
                  className="overflow-hidden rounded-2xl border border-[#E8DADD] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Couverture du cours */}
                  <div
                    className="relative h-36 overflow-hidden p-5"
                    style={{
                      background: COLORS[index % COLORS.length],
                    }}
                  >
                    <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border-[16px] border-white/20" />
                    <div className="absolute bottom-0 left-6 h-20 w-20 rotate-12 rounded-xl border border-white/40 bg-white/10" />

                    <span className="relative rounded-full bg-white/70 px-3 py-1 text-xs text-[#525871]">
                      StudyMind
                    </span>
                  </div>

                  {/* Details du cours */}
                  <div className="p-5">
                    <h4
                      className="text-xl"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {title}
                    </h4>

                    <p className="mt-2 text-sm text-[#857C91]">
                      Ouvrir le cours →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ACTIONS RAPIDES */}
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          <Link
            href="/courses/new"
            className="rounded-2xl bg-[#F2C1A3] p-6 transition hover:opacity-90"
          >
            <p className="text-sm text-[#525871]/70">
              Organisation
            </p>

            <h4
              className="mt-2 text-2xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              + Ajouter un cours
            </h4>
          </Link>

          <Link
            href="/chat"
            className="rounded-2xl bg-[#E6D8DF] p-6 transition hover:opacity-90"
          >
            <p className="text-sm text-[#525871]/70">
              Assistant intelligent
            </p>

            <h4
              className="mt-2 text-2xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              ✦ Poser une question
            </h4>
          </Link>
        </div>

      </main>
    </div>
  );
}