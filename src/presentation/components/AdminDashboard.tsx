"use client";

import { useEffect, useState } from "react";
import { AdminUserActivityPanel } from "@/presentation/components/AdminUserActivityPanel";
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
      fetch("/api/admin/user-activity?page=1&pageSize=1").then((r) => r.json()),
      fetch("/api/admin/leads?page=1&pageSize=1&status=new").then((r) => r.json()),
      fetch("/api/admin/progress").then((r) => r.json()),
      fetch("/api/admin/content/articles").then((r) => r.json()),
    ])
      .then(([usersData, leadsData, progressData, contentData]) => {
        const totalUsers = usersData?.meta?.total ?? 0;
        const newLeads = leadsData?.meta?.total ?? 0;
        const results: unknown[] = progressData.results ?? [];
        const articles: { isPublished: boolean }[] = contentData.articles ?? [];

        setMetrics({
          totalUsers,
          newLeads,
          testResults: results.length,
          publishedArticles: articles.filter((a) => a.isPublished).length,
        });
      })
      .catch(() => {
        setMetrics(null);
      });
  }, []);

  return (
    <div className="admin-dashboard">
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

      <div className="test-selector admin-dashboard-tabs">
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

      <div className="admin-dashboard-panel">
        {activeTab === "users" ? <AdminUserActivityPanel /> : null}
        {activeTab === "roles" ? <AdminRolesPanel /> : null}
        {activeTab === "leads" ? <AdminLeadsPanel /> : null}
        {activeTab === "content" ? <AdminContentPanel /> : null}
      </div>
    </div>
  );
};
