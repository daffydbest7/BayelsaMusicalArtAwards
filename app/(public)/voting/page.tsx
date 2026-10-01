import { redirect } from "next/navigation";
export type { PublicNominee } from "@/app/(public)/page";

export default function VotingPage() {
  redirect("/");
}
