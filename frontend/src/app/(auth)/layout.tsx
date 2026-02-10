export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
