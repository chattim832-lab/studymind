"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "../_components/AuthLayout";

const API_URL = "http://127.0.0.1:8001";

const inputClass =
  "w-full border-0 border-b border-[#D7CED4] bg-transparent px-0 py-3 text-[#29344F] outline-none transition placeholder:text-[#A59DA8] focus:border-[#525871] focus:outline-none";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Inscription avec FastAPI
  async function handleRegister(event) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        API_URL + "/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
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
            : "Impossible de créer le compte."
        );
      }

      setSuccess(true);
      setPassword("");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur d'inscription."
      );
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
          <Link
            href="/login"
            className="font-semibold text-[#525871] hover:underline"
          >
            Login
          </Link>
        </>
      }
    >

      <form
        onSubmit={handleRegister}
        className="space-y-5"
      >

        {/* NOM */}
        <div>
          <label
            htmlFor="register-name"
            className="block text-xs font-medium text-[#857C91]"
          >
            Nom complet
          </label>

          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Ton nom"
            autoComplete="name"
            minLength={2}
            maxLength={60}
            required
            className={inputClass}
          />
        </div>

        {/* EMAIL */}
        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-medium text-[#857C91]"
          >
            Email
          </label>

          <input
            id="register-email"
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
            htmlFor="register-password"
            className="block text-xs font-medium text-[#857C91]"
          >
            Mot de passe
          </label>

          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Minimum 8 caractères"
            autoComplete="new-password"
            minLength={8}
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

        {/* SUCCESS */}
        {success && (
          <p
            role="status"
            className="rounded-lg bg-[#F2ECEA] px-4 py-3 text-sm text-[#525871]"
          >
            Compte créé avec succès ! Tu peux maintenant{" "}
            <Link
              href="/login"
              className="font-semibold underline"
            >
              te connecter
            </Link>.
          </p>
        )}

        {/* REGISTER BUTTON */}
        <button
          type="submit"
          disabled={loading || success}
          className="w-full rounded-xl bg-[#525871] py-3.5 font-medium text-white transition hover:bg-[#3D435A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Inscription..."
            : "Create account"}
        </button>

      </form>
    </AuthLayout>
  );
}