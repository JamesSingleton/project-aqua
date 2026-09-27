import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset your Lane4 HQ account password.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
