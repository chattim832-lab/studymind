"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/courses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description,
          }),
        }
      );

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem("studymind_token");
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.detail === "string"
            ? data.detail
            : "Erreur lors de l'ajout du cours"
        );
        return;
      }

      // Retourner vers la liste des cours
      router.push("/courses");

    } catch (err) {
      setError("Impossible de contacter le serveur FastAPI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 shadow">

        <h1 className="text-3xl font-bold text-blue-700">
          StudyMind
        </h1>

        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Ajouter un cours
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          <div>
            <label className="block text-gray-700">
              Titre du cours
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="Exemple : Android"
              className="mt-2 w-full rounded-lg border p-3 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              placeholder="Description du cours..."
              className="mt-2 w-full rounded-lg border p-3 text-gray-900"
              rows={4}
            />
          </div>

          {error && (
            <p className="text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Ajout..." : "Ajouter le cours"}
          </button>

        </form>
      </div>
    </main>
  );
}