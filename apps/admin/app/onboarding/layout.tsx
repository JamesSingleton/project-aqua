import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Set up your swim team on Project Aqua.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
