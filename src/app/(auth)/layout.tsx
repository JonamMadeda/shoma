import { AuthProvider } from "@/components/auth/AuthProvider";
import { FileText } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-accent-light px-4 py-12"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-md shadow-accent/30">
            <FileText className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            shoma
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-white p-8 shadow-xl shadow-accent/5">
          {children}
        </div>
      </div>
    </div>
  );
}