import { redirect } from "next/navigation";

// No separate progress page: keep old links functional.
export default function ProgressPage() {
  redirect("/dashboard#progression");
}
