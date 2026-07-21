import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home",
};

export default function HomePage() {
  redirect("/onboarding");
}
