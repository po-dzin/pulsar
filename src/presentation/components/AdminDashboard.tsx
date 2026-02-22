"use client";

import { useEffect, useState } from "react";
import { AdminUsersPanel } from "@/presentation/components/AdminUsersPanel";
import { AdminProgressPanel } from "@/presentation/components/AdminProgressPanel";
import { AdminRolesPanel } from "@/presentation/components/AdminRolesPanel";
import { AdminLeadsPanel } from "@/presentation/components/AdminLeadsPanel";
import { AdminContentPanel } from "@/presentation/components/AdminContentPanel";

type Tab = "users" | "roles" | "leads" | "content";

type Metrics = {
    totalUsers: number;
    newLeads: number;
    testResults: number;
    publishedArticles: number;
};

const TABS: { id: Tab; label: string }[] = [
    { id: "users", label: "Users & Progress" },
    { id: "roles", label: "Roles" },
    { id: "leads", label: "Leads" },
    { id: "content", label: "Content" },
];

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<Tab>("users");
    const [metrics, setMetrics] = useState<Metrics | null>(null);

    useEffect(() => {
        Promise.all([
            fetch("/api/admin/users").then((r) => r.json()),
            fetch("/api/admin/leads").then((r) => r.json()),
            fetch("/api/admin/progress").then((r) => r.json()),
            fetch("/api/admin/content/articles").then((r) => r.json()),
        ])
            .then(([usersData, leadsData, progressData, contentData]) => {
                const users: unknown[] = usersData.users ?? [];
                const leads: { status: string }[] = leadsData.leads ?? [];
                const results: unknown[] = progressData.results ?? [];
                const articles: { isPublished: boolean }[] = contentData.articles ?? [];

                setMetrics({
                    totalUsers: users.length,
                    newLeads: leads.filter((l) => l.status === "new").length,
                    testResults: results.length,
                    publishedArticles: articles.filter((a) => a.isPublished).length,
                });
            })
            .catch(() => { });
    }, []);

    return (
        <div className="admin-dashboard">
            {/* ── Metrics row ── */}
            <div className="admin-metrics-row">
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{metrics?.totalUsers ?? "—"}</span>
                    <span className="admin-stat-label">Total users</span>
                </div>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{metrics?.newLeads ?? "—"}</span>
                    <span className="admin-stat-label">New leads</span>
                </div>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{metrics?.testResults ?? "—"}</span>
                    <span className="admin-stat-label">Test results</span>
                </div>
                <div className="admin-stat-card">
                    <span className="admin-stat-value">{metrics?.publishedArticles ?? "—"}</span>
                    <span className="admin-stat-label">Published articles</span>
                </div>
            </div>

            {/* ── Tab bar ── */}
            <div className="test-selector" style={{ marginTop: "var(--space-4)" }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className="test-selector-tab"
                        data-active={activeTab === tab.id || undefined}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Active panel ── */}
            <div style={{ marginTop: "var(--space-3)" }}>
                {activeTab === "users" && (
                    <div className="grid">
                        <AdminUsersPanel />
                        <AdminProgressPanel />
                    </div>
                )}
                {activeTab === "roles" && <AdminRolesPanel />}
                {activeTab === "leads" && <AdminLeadsPanel />}
                {activeTab === "content" && <AdminContentPanel />}
            </div>
        </div>
    );
};
