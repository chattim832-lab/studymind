"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "../_components/AuthLayout";

const API_URL = "http://127.0.0.1:8001";

const inputClass =
  "w-full border-0 border-b border-[#93A8AD] bg-transparent px-0 py-3 text-[#684F48] outline-none transition placeholder:text-[#93A8AD] focus:border-[#684F48] focus:outline-none";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(API_URL + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Impossible de créer le compte."
        );
      }

      setSuccess(true);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'inscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Register"
      subtitle="Crée ton compte et commence à organiser tes cours avec StudyMind."
      footer={
        <>
          Tu as déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-[#684F48] hover:underline">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label htmlFor="register-name" className="block text-xs font-medium text-[#7B969A]">
            Nom complet
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ton nom"
            autoComplete="name"
            minLength={2}
            maxLength={60}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="register-email" className="block text-xs font-medium text-[#7B969A]">
            Email
          </label>
          <input
            id="register-email"
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
          <label htmlFor="register-password" className="block text-xs font-medium text-[#7B969A]">
            Mot de passe
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
            minLength={8}
            required
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-[#F9E7C7] px-4 py-3 text-sm text-[#684F48]">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="rounded-lg bg-[#D6E9ED] px-4 py-3 text-sm text-[#684F48]">
            Compte créé avec succès ! Tu peux maintenant{" "}
            <Link href="/login" className="font-semibold underline">te connecter</Link>.
          </p>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full rounded-xl bg-[#684F48] py-3.5 font-medium text-white transition hover:bg-[#80645A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Inscription..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}