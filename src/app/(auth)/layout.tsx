import { AuthProvider } from "@/components/auth/AuthProvider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-serif text-xl font-semibold tracking-tight text-slate-800">
            shoma
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
