"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    async function getUser() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/auth/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Token invalide");
        }

        const data = await response.json();
        setUser(data);

      } catch (error) {
        console.error("Erreur :", error);
        sessionStorage.removeItem("studymind_token");
        router.replace("/login");
      }
    }

    getUser();
  }, [router]);

  function logout() {
    sessionStorage.removeItem("studymind_token");
    router.replace("/login");
  }

  if (!user) {
    return <p className="p-10">Chargement...</p>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">

        <h1 className="text-3xl font-bold text-blue-700">
          StudyMind
        </h1>

        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Bienvenue, {user.name} !
        </h2>

        <p className="mt-3 text-gray-600">
          Email : {user.email}
        </p>

        <button
          onClick={logout}
          className="mt-8 rounded-lg bg-red-600 px-5 py-3 text-white"
        >
          Se déconnecter
        </button>

      </div>
    </main>
  );
}