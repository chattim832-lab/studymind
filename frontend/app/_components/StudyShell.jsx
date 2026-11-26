"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const API_URL = "http://127.0.0.1:8001";

export function getId(item) {
  return String(item?.id || item?._id || "");
}

// Tous les appels API utilisent le JWT de la session actuelle.
export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem("studymind_token");
  if (!token) {
    window.location.assign("/login");
    throw new Error("Veuillez vous connecter.");
  }

  const headers = {
    Authorization: "Bearer " + token,
    ...(options.headers || {}),
  };
  let body = options.body;

  // JSON pour les POST classiques, FormData pour l'upload des PDF.
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (typeof body !== "string") body = JSON.stringify(body);
  }

  const response = await fetch(API_URL + path, {
    ...options,
    headers,
    body,
  });

  if (response.status === 401) {
    sessionStorage.removeItem("studymind_token");
    window.location.assign("/login");
    throw new Error("Votre session a expiré.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "";
    if (response.status === 404 && path.startsWith("/study/")) {
      throw new Error("Cette fonctionnalité nécessite le Backend du Sprint 3 (API non encore ajoutée).");
    }
    throw new Error(detail || "Erreur " + response.status + " lors de la requête.");
  }
  return data;
}

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/courses", label: "Mes cours", icon: "▤" },
  { href: "/chat", label: "Chatbot IA", icon: "✦" },
  { href: "/revision", label: "Révision", icon: "✎" },
  { href: "/progress", label: "Progression", icon: "◷" },
];

export default function StudyShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#FAF6F4] text-[#525871] md:flex">
      <aside className="flex w-full shrink-0 flex-col border-b border-[#E7DADD] bg-[#F3E9E7] p-5 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
        <Link href="/dashboard" className="mb-8 block px-3 pt-3">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            StudyMind
          </h1>
          <p className="mt-1 text-xs tracking-widest text-[#857C91]">YOUR STUDY SPACE</p>
        </Link>

        <p className="mb-3 px-4 text-xs uppercase tracking-widest text-[#A38E98]">Menu</p>
        <nav className="flex flex-col gap-2">
          {links.map((link) => {
            const active = pathname === link.href || (link.href === "/courses" && pathname.startsWith("/courses/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition " +
                  (active
                    ? "bg-[#E6D4D9] font-semibold text-[#525871]"
                    : "text-[#857C91] hover:bg-white/70 hover:text-[#525871]")
                }
              >
                <span aria-hidden="true" className="w-6 text-center text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-2xl bg-[#E8D8DD] p-4 md:mt-auto">
          <p className="text-sm font-semibold">Your learning companion</p>
          <p className="mt-2 text-xs leading-5 text-[#857C91]">
            Tes PDF, tes fiches et tes quiz, au même endroit.
          </p>
        </div>
        <button
          onClick={logout}
          className="mt-5 rounded-xl px-4 py-3 text-left text-sm text-[#857C91] hover:bg-white/70"
        >
          Déconnexion
        </button>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-7 md:px-9 lg:px-12">{children}</main>
    </div>
  );
}