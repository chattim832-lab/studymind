"use client";

import Link from "next/link";
import { getId } from "./StudyShell";

const DESIGNS = [
  { back: "#93A8AD", front: "#D6E9ED", pattern: "url('/studymind/folder-koi.jpg')", size: "cover" },
  { back: "#D6E9ED", front: "#F9E7C7", pattern: "url('/studymind/folder-checker.jpg')", size: "cover" },
  { back: "#684F48", front: "#D6E9ED", pattern: "repeating-radial-gradient(circle at 0 100%,transparent 0 13px,rgba(104,79,72,.17) 14px 15px,transparent 16px 30px)", size: "57px 57px" },
  { back: "#93A8AD", front: "#F9E7C7", pattern: "linear-gradient(90deg,rgba(104,79,72,.12) 1px,transparent 1px),linear-gradient(rgba(104,79,72,.12) 1px,transparent 1px)", size: "30px 30px" },
  { back: "#684F48", front: "#93A8AD", pattern: "radial-gradient(circle at 8px 8px,rgba(249,231,199,.75) 2px,transparent 3px)", size: "30px 30px" },
  { back: "#D6E9ED", front: "#F9E7C7", pattern: "repeating-linear-gradient(135deg,rgba(104,79,72,.15) 0 2px,transparent 2px 19px)", size: "auto" },
];

export default function CourseFolder({ course, index = 0 }) {
  const id = getId(course);
  const title = course.title || course.name || "Cours sans titre";
  const theme = DESIGNS[index % DESIGNS.length];

  return (
    <Link
      href={"/courses/" + encodeURIComponent(id)}
      aria-label={"Ouvrir le cours " + title}
      className="group block min-w-0 text-[#684F48] no-underline focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#684F48]"
    >
      {/* Dossier construit avec des styles directs : visible meme sans fichier CSS Module. */}
      <div
        className="relative h-[176px] w-full transition-transform duration-200 group-hover:-translate-y-1"
        style={{ filter: "drop-shadow(0 9px 9px rgba(104,79,72,.18))" }}
      >
        <div
          className="absolute left-[5%] top-[13px] h-[51px] w-[42%] rounded-t-[16px]"
          style={{ backgroundColor: theme.back }}
        />
        <div
          className="absolute bottom-[5px] left-[5%] right-[5%] top-[39px] rounded-[20px]"
          style={{ backgroundColor: theme.back }}
        />
        <div
          className="absolute bottom-[5px] left-[5%] right-[5%] top-[47px] overflow-hidden rounded-[18px] border border-white/60"
          style={{
            backgroundColor: theme.front,
            backgroundImage: theme.pattern,
            backgroundPosition: "center",
            backgroundSize: theme.size,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-[#684F48]/10" />
        </div>
      </div>
      <div className="px-2 pt-2">
        <h3 className="break-words font-serif text-lg font-semibold leading-snug">{title}</h3>
        {course.description && (
          <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-[#8C7770]">
            {course.description}
          </p>
        )}
      </div>
    </Link>
  );
}