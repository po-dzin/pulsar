"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AdminMobileCard } from "@/presentation/components/admin/AdminMobileCard";
import { AdminPagination } from "@/presentation/components/admin/AdminPagination";
import { AdminRowExpand } from "@/presentation/components/admin/AdminRowExpand";
import { AdminStatusBadge } from "@/presentation/components/admin/AdminStatusBadge";
import { AdminTable } from "@/presentation/components/admin/AdminTable";
import { AdminTableToolbar } from "@/presentation/components/admin/AdminTableToolbar";
import { useAdminToasts } from "@/presentation/components/admin/useAdminToasts";

type UserActivityRow = {
  userId: string;
  fullName: string | null;
  email: string;
  locale: "ru" | "en";
  createdAt: string;
  testsCount: number;
  lastTestAt: string | null;
  leadsCount: number;
  lastLeadAt: string | null;
  lastActivityAt: string;
};

type UserActivityDetails = {
  tests: Array<{
    id: string;
    testType: string;
    overallPct: number;
    level: string;
    createdAt: string;
  }>;
  leads: Array<{
    id: string;
    name: string;
    contact: string;
    message: string;
    status: "new" | "in_progress" | "done" | "archived";
    createdAt: string;
  }>;
};

type PagedResponse = {
  rows: UserActivityRow[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : fallbackMessage);
  }
  return body as T;
}

const formatDate = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

export const AdminUserActivityPanel = () => {
  const { pushToast } = useAdminToasts();

  const [data, setData] = useState<PagedResponse>({
    rows: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "lastActivityAt" | "testsCount" | "leadsCount">("lastActivityAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detailsByUserId, setDetailsByUserId] = useState<Record<string, UserActivityDetails>>({});
  const [detailsLoading, setDetailsLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        sortBy,
        sortDir,
      });
      if (search) params.set("search", search);

      try {
        const response = await parseJsonOrThrow<PagedResponse>(
          await fetch(`/api/admin/user-activity?${params.toString()}`),
          "Failed to load users activity."
        );
        setData({
          rows: response.rows ?? [],
          meta: response.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
        });
      } catch {
        pushToast({
          type: "error",
          title: "Users",
          message: "Failed to load users activity.",
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [page, pushToast, search, sortBy, sortDir]);

  const loadDetails = async (userId: string) => {
    if (detailsByUserId[userId]) return;
    setDetailsLoading((prev) => ({ ...prev, [userId]: true }));

    try {
      const response = await parseJsonOrThrow<UserActivityDetails>(
        await fetch(`/api/admin/user-activity/${userId}/details?testsLimit=5&leadsLimit=5`),
        "Failed to load user details."
      );
      setDetailsByUserId((prev) => ({
        ...prev,
        [userId]: {
          tests: response.tests ?? [],
          leads: response.leads ?? [],
        },
      }));
    } catch {
      pushToast({
        type: "error",
        title: "Users",
        message: "Failed to load user details.",
      });
    } finally {
      setDetailsLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const toggleExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    await loadDetails(userId);
  };

  const rows = useMemo(() => data.rows ?? [], [data.rows]);

  return (
    <section className="card" data-testid="admin-user-activity-panel">
      <h3>Users & Progress</h3>
      <AdminTableToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name or email"
        rightSlot={
          <div className="admin-toolbar-controls">
            <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="lastActivityAt">Last activity</option>
              <option value="createdAt">Created at</option>
              <option value="testsCount">Tests count</option>
              <option value="leadsCount">Leads count</option>
            </select>
            <select className="select" value={sortDir} onChange={(event) => setSortDir(event.target.value as typeof sortDir)}>
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        }
      />

      <div className="admin-desktop-only">
        <AdminTable
          columns={[
            { key: "user", label: "User" },
            { key: "email", label: "Email" },
            { key: "locale", label: "Locale" },
            { key: "tests", label: "Tests" },
            { key: "leads", label: "Leads" },
            { key: "activity", label: "Last activity" },
            { key: "actions", label: "Actions", className: "admin-col-actions" },
          ]}
          hasRows={rows.length > 0}
          emptyMessage={loading ? "Loading..." : "No users found."}
          testId="admin-user-activity-table"
        >
          {rows.map((row, index) => {
            const expanded = expandedUserId === row.userId;
            const details = detailsByUserId[row.userId];
            const isDetailsLoading = detailsLoading[row.userId];

            return (
              <Fragment key={row.userId}>
                <tr data-testid={`admin-user-activity-row-${index}`}>
                  <td><span className="admin-cell-ellipsis">{row.fullName ?? "User"}</span></td>
                  <td><span className="admin-cell-ellipsis">{row.email}</span></td>
                  <td>
                    <AdminStatusBadge label={row.locale.toUpperCase()} tone="info" />
                  </td>
                  <td>{row.testsCount}</td>
                  <td>{row.leadsCount}</td>
                  <td><span className="admin-cell-ellipsis">{formatDate(row.lastActivityAt)}</span></td>
                  <td>
                    <AdminRowExpand
                      expanded={expanded}
                      onToggle={() => void toggleExpand(row.userId)}
                      label="View"
                      testId={`admin-user-row-expand-${index}`}
                    />
                  </td>
                </tr>
                {expanded ? (
                  <tr className="admin-row-details">
                    <td colSpan={7}>
                      {isDetailsLoading ? (
                        <p className="muted">Loading details...</p>
                      ) : (
                        <div className="admin-details-grid">
                          <div>
                            <h4>Latest tests</h4>
                            {details?.tests.length ? (
                              <ul className="admin-details-list">
                                {details.tests.map((test) => (
                                  <li key={test.id}>
                                    <span className="admin-cell-ellipsis">{test.testType}</span>
                                    <strong>{test.overallPct}%</strong>
                                    <span className="muted">{formatDate(test.createdAt)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="muted">No tests yet.</p>
                            )}
                          </div>

                          <div>
                            <h4>Latest consultation leads</h4>
                            {details?.leads.length ? (
                              <ul className="admin-details-list">
                                {details.leads.map((lead) => (
                                  <li key={lead.id}>
                                    <span className="admin-cell-ellipsis">{lead.name}</span>
                                    <span className="muted">{lead.status}</span>
                                    <span className="muted">{formatDate(lead.createdAt)}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="muted">No leads yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </AdminTable>
      </div>

      <div className="admin-mobile-only">
        <div className="admin-mobile-list" data-testid="admin-user-activity-mobile-list">
          {rows.map((row) => {
            const expanded = expandedUserId === row.userId;
            const details = detailsByUserId[row.userId];
            const isDetailsLoading = detailsLoading[row.userId];
            return (
              <AdminMobileCard
                key={row.userId}
                title={row.fullName ?? "User"}
                subtitle={row.email}
                expanded={expanded}
                onToggle={() => void toggleExpand(row.userId)}
                actions={
                  <div className="admin-mobile-inline">
                    <AdminStatusBadge label={row.locale.toUpperCase()} tone="info" />
                    <span className="muted">Tests: {row.testsCount}</span>
                    <span className="muted">Leads: {row.leadsCount}</span>
                  </div>
                }
              >
                {isDetailsLoading ? <p className="muted">Loading details...</p> : null}
                {!isDetailsLoading ? (
                  <>
                    <p className="muted">Last activity: {formatDate(row.lastActivityAt)}</p>
                    <p className="admin-mobile-section-label">Latest tests</p>
                    {details?.tests.length ? (
                      <ul className="admin-details-list">
                        {details.tests.map((test) => (
                          <li key={test.id}>
                            <span className="admin-cell-ellipsis">{test.testType}</span>
                            <strong>{test.overallPct}%</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">No tests yet.</p>
                    )}
                    <p className="admin-mobile-section-label">Latest consultation leads</p>
                    {details?.leads.length ? (
                      <ul className="admin-details-list">
                        {details.leads.map((lead) => (
                          <li key={lead.id}>
                            <span className="admin-cell-ellipsis">{lead.name}</span>
                            <span className="muted admin-cell-ellipsis">{lead.message}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">No leads yet.</p>
                    )}
                  </>
                ) : null}
              </AdminMobileCard>
            );
          })}
          {!rows.length ? <p className="muted">{loading ? "Loading..." : "No users found."}</p> : null}
        </div>
      </div>

      <AdminPagination
        page={data.meta.page}
        totalPages={data.meta.totalPages}
        disabled={loading}
        onPrev={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(data.meta.totalPages, value + 1))}
      />
    </section>
  );
};
