export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1>Auth Layout</h1>
      {children}
    </>
  );
}
