import type { ReactNode } from "react";
import Link from "next/link";
import { AdminToastProvider } from "@/presentation/components/admin/AdminToastProvider";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="admin-shell">
            {/* Slim admin topbar — no public nav */}
            <header className="admin-topbar">
                <span className="admin-topbar-brand">PULSAR</span>
                <Link href="/" className="admin-topbar-back">
                    ← Back to site
                </Link>
            </header>

            <main className="admin-main">
                <AdminToastProvider>
                    {children}
                </AdminToastProvider>
            </main>
        </div>
    );
}
