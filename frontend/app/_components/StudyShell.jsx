"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export const API_URL = "http://127.0.0.1:8001";

export function getId(item) {
  return String(item?.id || item?._id || "");
}

// Keep the original FastAPI/JWT and PDF-upload behavior.
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
  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    if (typeof body !== "string") body = JSON.stringify(body);
  }
  const response = await fetch(API_URL + path, { ...options, headers, body });
  if (response.status === 401) {
    sessionStorage.removeItem("studymind_token");
    window.location.assign("/login");
    throw new Error("Votre session a expiré.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : "";
    throw new Error(detail || "Erreur HTTP " + response.status);
  }
  return data;
}

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/courses", label: "Mes cours", icon: "folder" },
  { href: "/chat", label: "Chatbot IA", icon: "chat" },
  { href: "/revision", label: "Révision", icon: "book" },
];

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === "dashboard" && <><rect x="3" y="3" width="7" height="7" rx="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.8"/></>}
      {name === "folder" && <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>}
      {name === "chat" && <><path d="M21 11.4a8.4 8.4 0 0 1-8.4 8.4H5l1.8-3.9A8.4 8.4 0 1 1 21 11.4Z"/><path d="M9 11.5h6"/></>}
      {name === "book" && <><path d="M12 6c-3-1.8-6-1.8-9-1v14c3-.9 6-.9 9 1"/><path d="M12 6c3-1.8 6-1.8 9-1v14c-3-.9-6-.9-9 1"/><path d="M12 6v14"/></>}
      {name === "logout" && <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M15 16l4-4-4-4M19 12H9"/></>}
    </svg>
  );
}

export default function StudyShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#684F48] md:flex">
      {/* Small, fixed-width sidebar like reference image 1. */}
      <aside className="z-20 flex w-full shrink-0 items-center justify-between border-b border-[#DDE9E7] bg-[#D6E9ED] px-3 py-2 md:sticky md:top-0 md:h-screen md:w-[78px] md:flex-col md:justify-start md:border-b-0 md:border-r md:px-2 md:py-5">
        <Link href="/dashboard" title="StudyMind" aria-label="StudyMind, accueil" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#684F48] text-[13px] font-bold tracking-tight text-[#F9E7C7] shadow-sm" style={{ fontFamily: "Georgia, serif" }}>
          SM
        </Link>
        <nav className="flex items-center gap-1 md:mt-10 md:w-full md:flex-col md:gap-4" aria-label="Navigation principale">
          {items.map((item) => {
            const active = pathname === item.href || (item.href === "/courses" && pathname.startsWith("/courses/"));
            return (
              <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} aria-current={active ? "page" : undefined} className={"flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all hover:-translate-y-0.5 " + (active ? "bg-[#684F48] text-white shadow-sm" : "text-[#684F48] hover:bg-white/70")}>
                <NavIcon name={item.icon}/>
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={logout} aria-label="Déconnexion" title="Déconnexion" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#684F48] transition hover:bg-white/70 md:mt-auto">
          <NavIcon name="logout"/>
        </button>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 2xl:px-10">{children}</main>
    </div>
  );
}
