"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { AdminMobileCard } from "@/presentation/components/admin/AdminMobileCard";
import { AdminPagination } from "@/presentation/components/admin/AdminPagination";
import { AdminStatusBadge } from "@/presentation/components/admin/AdminStatusBadge";
import { AdminTable } from "@/presentation/components/admin/AdminTable";
import { AdminTableToolbar } from "@/presentation/components/admin/AdminTableToolbar";
import { useAdminToasts } from "@/presentation/components/admin/useAdminToasts";

type RoleRow = {
  userId: string;
  fullName: string | null;
  email: string;
  role: "admin" | "user";
  assignedAt: string | null;
  createdAt: string;
};

type RolesResponse = {
  rows: RoleRow[];
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

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleString() : "—");

export const AdminRolesPanel = () => {
  const { pushToast } = useAdminToasts();

  const [data, setData] = useState<RolesResponse>({
    rows: [],
    meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "email" | "fullName" | "role" | "assignedAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [confirmUser, setConfirmUser] = useState<RoleRow | null>(null);

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
    });
    if (search) params.set("search", search);

    try {
      const response = await parseJsonOrThrow<RolesResponse>(
        await fetch(`/api/admin/roles?${params.toString()}`),
        "Failed to load roles."
      );
      setData({
        rows: response.rows ?? [],
        meta: response.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      });
    } catch {
      pushToast({
        type: "error",
        title: "Roles",
        message: "Failed to load roles.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortDir]);

  const grantAdmin = async () => {
    if (!grantEmail.trim()) {
      pushToast({
        type: "warning",
        title: "Roles",
        message: "Provide email to grant admin role.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "admin", email: grantEmail.trim() }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        pushToast({
          type: "error",
          title: "Roles",
          message: body.error ?? "Failed to grant role.",
        });
        return;
      }

      pushToast({
        type: "success",
        title: "Roles",
        message: "Role assigned.",
      });
      setGrantEmail("");
      await load();
    } finally {
      setLoading(false);
    }
  };

  const revokeAdmin = async (row: RoleRow) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.userId, role: "admin" }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        pushToast({
          type: "error",
          title: "Roles",
          message: body.error ?? "Failed to revoke role.",
        });
        return;
      }

      pushToast({
        type: "success",
        title: "Roles",
        message: "Role revoked.",
      });
      await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {confirmUser ? (
        <ConfirmDialog
          title="Revoke admin role?"
          body={`Remove admin access for ${confirmUser.fullName ?? confirmUser.email}?`}
          confirmLabel="Yes, revoke"
          cancelLabel="Cancel"
          onConfirm={async () => {
            const target = confirmUser;
            setConfirmUser(null);
            await revokeAdmin(target);
          }}
          onCancel={() => setConfirmUser(null)}
        />
      ) : null}

      <section className="card" data-testid="admin-roles-panel">
        <h3>Roles</h3>

        <div className="admin-compact-form">
          <input
            className="input"
            value={grantEmail}
            onChange={(event) => setGrantEmail(event.target.value)}
            placeholder="User email"
            data-testid="admin-role-grant-email"
          />
          <button
            type="button"
            className="button button-primary admin-table-action-btn"
            onClick={() => void grantAdmin()}
            disabled={loading}
            data-testid="assign-role-button"
          >
            Grant admin
          </button>
        </div>

        <AdminTableToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search by name or email"
          rightSlot={
            <div className="admin-toolbar-controls">
              <select className="select" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)}>
                <option value="createdAt">Created at</option>
                <option value="fullName">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="assignedAt">Assigned at</option>
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
              { key: "email", label: "Email" },
              { key: "role", label: "Role" },
              { key: "revoke", label: "Actions", className: "admin-col-actions" },
            ]}
            hasRows={data.rows.length > 0}
            emptyMessage={loading ? "Loading..." : "No users found."}
          >
            {data.rows.map((item, index) => (
              <tr key={item.userId} data-testid={`admin-role-row-${index}`}>
                <td><span className="admin-cell-ellipsis">{item.fullName ?? "User"}</span></td>
                <td><span className="admin-cell-ellipsis">{item.email}</span></td>
                <td>
                  <AdminStatusBadge label={item.role} tone={item.role === "admin" ? "warning" : "neutral"} />
                  <span className="muted admin-inline-note admin-cell-ellipsis">{formatDate(item.assignedAt)}</span>
                </td>
                <td>
                  {item.role === "admin" ? (
                    <button
                      type="button"
                      className="button button-danger admin-table-action-btn"
                      onClick={() => setConfirmUser(item)}
                      disabled={loading}
                      data-testid={`revoke-role-button-${index}`}
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </AdminTable>
        </div>

        <div className="admin-mobile-only">
          <div className="admin-mobile-list">
            {data.rows.map((item, index) => (
              <AdminMobileCard
                key={item.userId}
                title={item.fullName ?? "User"}
                subtitle={item.email}
                expanded={false}
                onToggle={() => {}}
                showToggle={false}
                actions={
                  <div className="admin-mobile-inline">
                    <AdminStatusBadge label={item.role} tone={item.role === "admin" ? "warning" : "neutral"} />
                    {item.role === "admin" ? (
                      <button
                        type="button"
                        className="button button-danger admin-table-action-btn"
                        onClick={() => setConfirmUser(item)}
                        disabled={loading}
                        data-testid={`revoke-role-mobile-${index}`}
                      >
                        Revoke
                      </button>
                    ) : null}
                  </div>
                }
              >
                <p className="muted">Assigned: {formatDate(item.assignedAt)}</p>
              </AdminMobileCard>
            ))}
            {!data.rows.length ? <p className="muted">{loading ? "Loading..." : "No users found."}</p> : null}
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
    </>
  );
};
