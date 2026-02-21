import { AdminSidebar } from "@/components/admin/sidebar";
import { Providers } from "@/components/providers";
import "../globals.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers locale="en">
          <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 p-8 bg-gray-100">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
} 