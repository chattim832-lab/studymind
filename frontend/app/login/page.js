"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "../_components/AuthLayout";

const API_URL = "http://127.0.0.1:8001";

const inputClass =
  "w-full border-0 border-b border-[#D7CED4] bg-transparent px-0 py-3 text-[#29344F] outline-none transition placeholder:text-[#A59DA8] focus:border-[#525871] focus:outline-none";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Connexion avec FastAPI
  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        API_URL + "/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

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

      // Sauvegarder le JWT
      sessionStorage.setItem(
        "studymind_token",
        data.access_token
      );

      // Aller au Dashboard
      router.replace("/dashboard");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur de connexion."
      );
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
          <Link
            href="/register"
            className="font-semibold text-[#525871] hover:underline"
          >
           S&apos;inscrire
          </Link>
        </>
      }
    >

      <form
        onSubmit={handleLogin}
        className="space-y-7"
      >

        {/* EMAIL */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-[#857C91]"
          >
            Email
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="exemple@email.com"
            autoComplete="email"
            required
            className={inputClass}
          />
        </div>

        {/* PASSWORD */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-[#857C91]"
          >
            Mot de passe
          </label>

          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Ton mot de passe"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        {/* ERREUR */}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-[#F9E8E7] px-4 py-3 text-sm text-[#8A3F48]"
          >
            {error}
          </p>
        )}

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#525871] py-3.5 font-medium text-white transition hover:bg-[#3D435A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Login"}
        </button>

      </form>
    </AuthLayout>
  );
}