"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadingCourseId, setUploadingCourseId] = useState(null);
const [uploadMessages, setUploadMessages] = useState({});
const [pdfLists, setPdfLists] = useState({});
const [pdfLoading, setPdfLoading] = useState(null);
const [pdfErrors, setPdfErrors] = useState({});

  useEffect(() => {
    const token = sessionStorage.getItem("studymind_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;

    async function loadCourses() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/courses",
          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          sessionStorage.removeItem("studymind_token");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Impossible de charger les cours");
        }

        const data = await response.json();

        if (active) {
          setCourses(data);
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

  async function deleteCourse(courseId) {
  const confirmation = window.confirm(
    "Voulez-vous vraiment supprimer ce cours ?"
  );

  if (!confirmation) {
    return;
  }

  const token = sessionStorage.getItem("studymind_token");

  if (!token) {
    router.replace("/login");
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/courses/" + courseId,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem("studymind_token");
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      throw new Error("Impossible de supprimer le cours");
    }

    setCourses((previousCourses) =>
      previousCourses.filter(
        (course) => course.id !== courseId
      )
    );

    setError("");
  } catch (err) {
    setError(err.message);
  }
}

async function uploadCoursePdf(event, courseId) {
  event.preventDefault();

  const form = event.currentTarget;
  const formData = new FormData(form);
  const file = formData.get("file");

  if (!file || file.size === 0) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    setUploadMessages((prev) => ({
      ...prev,
      [courseId]: "Veuillez sélectionner un fichier PDF.",
    }));
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    setUploadMessages((prev) => ({
      ...prev,
      [courseId]: "Le PDF ne doit pas dépasser 10 Mo.",
    }));
    return;
  }

  const token = sessionStorage.getItem("studymind_token");

  if (!token) {
    router.replace("/login");
    return;
  }

  setUploadingCourseId(courseId);
  setUploadMessages((prev) => ({
    ...prev,
    [courseId]: "",
  }));

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/courses/" + courseId + "/pdfs",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      }
    );

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem("studymind_token");
      router.replace("/login");
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Erreur lors de l'upload."
      );
    }

    setUploadMessages((prev) => ({
      ...prev,
      [courseId]: "PDF ajouté avec succès !",
    }));

    form.reset();

  } catch (error) {
    setUploadMessages((prev) => ({
      ...prev,
      [courseId]: error.message,
    }));
  } finally {
    setUploadingCourseId(null);
  }
}

async function loadCoursePdfs(courseId) {
  const token = sessionStorage.getItem("studymind_token");

  if (!token) {
    router.replace("/login");
    return;
  }

  setPdfLoading(courseId);

  setPdfErrors((prev) => ({
    ...prev,
    [courseId]: "",
  }));

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/courses/" + courseId + "/pdfs",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
        },
      }
    );

    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem("studymind_token");
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      throw new Error("Impossible de charger les PDF");
    }

    const data = await response.json();

    setPdfLists((prev) => ({
      ...prev,
      [courseId]: data,
    }));

  } catch (error) {
    setPdfErrors((prev) => ({
      ...prev,
      [courseId]: error.message,
    }));
  } finally {
    setPdfLoading(null);
  }
}


  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-4xl">

        <h1 className="text-3xl font-bold text-blue-700">
          StudyMind
        </h1>

        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Mes cours
        </h2>

        <div className="mt-6">
  <Link
    href="/courses/new"
    className="inline-block rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
  >
    + Nouveau cours
  </Link>
</div>

        <p className="mt-2 text-gray-600">
          Retrouvez tous vos cours ici.
        </p>

        {loading && (
          <p className="mt-6 text-gray-700">
            Chargement des cours...
          </p>
        )}

        {error && (
          <p className="mt-6 text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && courses.length === 0 && (
          <p className="mt-6 text-gray-600">
            Aucun cours pour le moment.
          </p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <div
              key={course.id}
              className="rounded-xl bg-white p-6 shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900">
                {course.title}
              </h3>

              <p className="mt-2 text-gray-600">
                {course.description}
              </p>

              <button
  onClick={() => deleteCourse(course.id)}
  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
>
  Supprimer
</button>

<form
  onSubmit={(event) => uploadCoursePdf(event, course.id)}
  className="mt-4 space-y-3"
>
  <label className="block text-sm font-medium text-gray-700">
    Ajouter un PDF
  </label>

  <input
    type="file"
    name="file"
    accept=".pdf,application/pdf"
    required
    className="block w-full text-sm text-gray-700"
  />

  <button
    type="submit"
    disabled={uploadingCourseId !== null}
    className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 disabled:opacity-50"
  >
    {uploadingCourseId === course.id
      ? "Upload en cours..."
      : "Upload PDF"}
  </button>

  {uploadMessages[course.id] && (
    <p className="text-sm text-gray-700" role="status">
      {uploadMessages[course.id]}
    </p>
  )}
</form>

<div className="mt-4 border-t pt-4">
  <button
    type="button"
    onClick={() => loadCoursePdfs(course.id)}
    disabled={pdfLoading !== null}
    className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
  >
    {pdfLoading === course.id
      ? "Chargement..."
      : "Afficher les PDF"}
  </button>

  {pdfErrors[course.id] && (
    <p className="mt-3 text-sm text-red-600">
      {pdfErrors[course.id]}
    </p>
  )}

  {pdfLists[course.id] !== undefined && (
    <div className="mt-4">
      <h4 className="font-semibold text-gray-900">
        Documents PDF
      </h4>

      {pdfLists[course.id].length === 0 ? (
        <p className="mt-2 text-gray-600">
          Aucun PDF dans ce cours.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {pdfLists[course.id].map((pdf) => (
            <li
              key={pdf.id}
              className="rounded-lg bg-slate-100 p-3 text-sm text-gray-800"
            >
              📄 {pdf.filename}
            </li>
          ))}
        </ul>
      )}
    </div>
  )}
</div>

            </div>
          ))}
        </div>

      </div>
    </main>
  );
}