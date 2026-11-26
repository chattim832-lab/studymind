"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "../_components/AuthLayout";

const API_URL = "http://127.0.0.1:8001";

const inputClass =
  "w-full border-0 border-b border-[#93A8AD] bg-transparent px-0 py-3 text-[#684F48] outline-none transition placeholder:text-[#93A8AD] focus:border-[#684F48] focus:outline-none";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Connexion impossible. Vérifiez vos informations."
        );
      }
      if (!data.access_token) {
        throw new Error("Aucun token reçu du serveur.");
      }

      sessionStorage.setItem("studymind_token", data.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Login"
      subtitle="Heureux de te retrouver ! Connecte-toi pour continuer à apprendre."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-[#684F48] hover:underline">
            S'inscrire
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-7">
        <div>
          <label htmlFor="login-email" className="block text-xs font-medium text-[#7B969A]">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="exemple@email.com"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-medium text-[#7B969A]">
            Mot de passe
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ton mot de passe"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-[#F9E7C7] px-4 py-3 text-sm text-[#684F48]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#684F48] py-3.5 font-medium text-white transition hover:bg-[#80645A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
}