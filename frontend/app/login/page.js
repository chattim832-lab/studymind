"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Erreur de connexion"
        );
        return;
      }

      // Sauvegarder temporairement le token pour les tests
     sessionStorage.setItem(
  "studymind_token",
  data.access_token
);

router.replace("/dashboard");

    } catch (error) {
      setMessage("Impossible de contacter FastAPI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <h1 className="text-center text-3xl font-bold text-blue-700">
          StudyMind
        </h1>

        <h2 className="mt-3 text-center text-xl font-semibold text-gray-800">
          Connexion
        </h2>

        <p className="mt-2 text-center text-sm text-gray-500">
          Connectez-vous à votre espace étudiant
        </p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Votre email"
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          {message && (
            <p role="status" className="text-center text-sm text-gray-700">
              {message}
            </p>
          )}

          <p className="text-center text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-blue-700 hover:underline">
              S inscrire
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}