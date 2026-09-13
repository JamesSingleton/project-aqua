import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Two-factor authentication",
  description: "Verify your identity to continue signing in.",
};

export default function TwoFactorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
