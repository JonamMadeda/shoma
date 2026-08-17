import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 pb-14 lg:pb-0">
        <main className="flex-1 animate-fade-in px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
