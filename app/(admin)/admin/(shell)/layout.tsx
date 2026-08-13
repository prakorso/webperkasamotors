import { AdminShellProvider } from "@/components/admin/admin-shell-context";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShellProvider>
      <div className="min-h-full bg-paper">
        <Sidebar />
        <div className="lg:pl-64">
          <Topbar />
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminShellProvider>
  );
}
