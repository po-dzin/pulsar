"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { AdminMobileCard } from "@/presentation/components/admin/AdminMobileCard";
import { AdminRowExpand } from "@/presentation/components/admin/AdminRowExpand";
import { AdminStatusBadge } from "@/presentation/components/admin/AdminStatusBadge";
import { AdminTable } from "@/presentation/components/admin/AdminTable";
import { AdminTableToolbar } from "@/presentation/components/admin/AdminTableToolbar";

type Lead = {
  id: string;
  userId: string;
  name: string;
  contact: string;
  message: string;
  status: "new" | "in_progress" | "done" | "archived";
  createdAt: string;
  updatedAt: string;
};

type LeadsResponse = {
  rows: Lead[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "—");

const toneByStatus: Record<Lead["status"], "neutral" | "warning" | "success" | "danger"> = {
  new: "warning",
  in_progress: "neutral",
  done: "success",
  archived: "danger",
};

const ellipsis = (text: string, limit = 76) => (text.length > limit ? `${text.slice(0, limit)}...` : text);

export const AdminLeadsPanel = () => {
  const [data, setData] = useState<LeadsResponse>({
    rows: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Lead["status"] | "all">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "name" | "status">("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, Lead["status"]>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      sortBy,
      sortDir,
      status: statusFilter,
    });
    if (search) params.set("search", search);

    const response = await fetch(`/api/admin/leads?${params.toString()}`).then((res) => res.json());
    setData({
      rows: response.rows ?? [],
      meta: response.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    setPendingStatuses({});
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortDir, statusFilter]);

  const updateStatus = async (id: string, status: Lead["status"]) => {
    await fetch(`/api/admin/leads/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setData((prev) => ({
      ...prev,
      rows: prev.rows.map((lead) => (lead.id === id ? { ...lead, status, updatedAt: new Date().toISOString() } : lead)),
    }));
  };

  const rows = useMemo(() => data.rows ?? [], [data.rows]);

  return (
    <section className="card" data-testid="admin-leads-table">
      <h3>Leads</h3>

      <AdminTableToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Search by name, contact or request"
        leftSlot={
          <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">all</option>
            <option value="new">new</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
            <option value="archived">archived</option>
          </select>
        }
        rightSlot={
          <div className="admin-toolbar-controls">
            <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
              <option value="updatedAt">Updated at</option>
              <option value="createdAt">Created at</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
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
            { key: "name", label: "Name" },
            { key: "contact", label: "Email/Contact" },
            { key: "request", label: "Request" },
            { key: "status", label: "Status" },
            { key: "updated", label: "Updated" },
            { key: "actions", label: "Actions", className: "admin-col-actions" },
          ]}
          hasRows={rows.length > 0}
          emptyMessage={loading ? "Loading..." : "No leads found."}
        >
          {rows.map((lead, index) => {
            const expanded = expandedLeadId === lead.id;
            const pendingStatus = pendingStatuses[lead.id] ?? lead.status;

            return (
              <Fragment key={lead.id}>
                <tr data-testid={`admin-lead-row-${index}`}>
                  <td>{lead.name}</td>
                  <td>{lead.contact}</td>
                  <td>{ellipsis(lead.message)}</td>
                  <td>
                    <AdminStatusBadge label={lead.status} tone={toneByStatus[lead.status]} />
                  </td>
                  <td>{formatDate(lead.updatedAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <select
                        className="select"
                        value={pendingStatus}
                        onChange={(event) =>
                          setPendingStatuses((prev) => ({ ...prev, [lead.id]: event.target.value as Lead["status"] }))
                        }
                        data-testid={`lead-status-select-${index}`}
                      >
                        <option value="new">new</option>
                        <option value="in_progress">in_progress</option>
                        <option value="done">done</option>
                        <option value="archived">archived</option>
                      </select>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => void updateStatus(lead.id, pendingStatus)}
                        data-testid={`lead-status-save-${index}`}
                      >
                        Save
                      </button>
                      <AdminRowExpand
                        expanded={expanded}
                        onToggle={() => setExpandedLeadId((prev) => (prev === lead.id ? null : lead.id))}
                        label="Request"
                      />
                    </div>
                  </td>
                </tr>
                {expanded ? (
                  <tr className="admin-row-details">
                    <td colSpan={6}>
                      <p className="admin-detail-text">{lead.message}</p>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </AdminTable>
      </div>

      <div className="admin-mobile-only">
        <div className="admin-mobile-list">
          {rows.map((lead, index) => {
            const expanded = expandedLeadId === lead.id;
            const pendingStatus = pendingStatuses[lead.id] ?? lead.status;
            return (
              <AdminMobileCard
                key={lead.id}
                title={lead.name}
                subtitle={lead.contact}
                expanded={expanded}
                onToggle={() => setExpandedLeadId((prev) => (prev === lead.id ? null : lead.id))}
                actions={<AdminStatusBadge label={lead.status} tone={toneByStatus[lead.status]} />}
              >
                <p className="admin-detail-text">{lead.message}</p>
                <div className="admin-mobile-inline">
                  <select
                    className="select"
                    value={pendingStatus}
                    onChange={(event) => setPendingStatuses((prev) => ({ ...prev, [lead.id]: event.target.value as Lead["status"] }))}
                    data-testid={`lead-status-select-mobile-${index}`}
                  >
                    <option value="new">new</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                    <option value="archived">archived</option>
                  </select>
                  <button type="button" className="button button-primary" onClick={() => void updateStatus(lead.id, pendingStatus)}>
                    Save
                  </button>
                </div>
              </AdminMobileCard>
            );
          })}
          {!rows.length ? <p className="muted">{loading ? "Loading..." : "No leads found."}</p> : null}
        </div>
      </div>

      <div className="admin-pagination">
        <button type="button" className="button button-muted" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={data.meta.page <= 1 || loading}>
          Previous
        </button>
        <span className="muted">Page {data.meta.page} / {data.meta.totalPages}</span>
        <button
          type="button"
          className="button button-muted"
          onClick={() => setPage((value) => Math.min(data.meta.totalPages, value + 1))}
          disabled={data.meta.page >= data.meta.totalPages || loading}
        >
          Next
        </button>
      </div>
    </section>
  );
};
