"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
  fullName: string | null;
};

type RoleItem = {
  userId: string;
  role: "admin" | "editor";
  email: string | null;
  fullName: string | null;
  createdAt: string;
};

export const AdminRolesPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [role, setRole] = useState<"admin" | "editor">("editor");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) ?? null, [users, selectedUserId]);

  const load = async () => {
    const [usersResponse, rolesResponse] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/roles")]);
    const usersData = await usersResponse.json();
    const rolesData = await rolesResponse.json();

    setUsers(usersData.users ?? []);
    setRoles(rolesData.roles ?? []);
  };

  useEffect(() => {
    load().catch(() => setStatus("Failed to load roles"));
  }, []);

  const assignRole = async () => {
    if (!selectedUser) {
      setStatus("Select a user");
      return;
    }

    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/admin/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUser.id, role }),
    });
    setBusy(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(data.error ?? "Failed to assign role");
      return;
    }

    await load();
    setStatus("Role assigned");
  };

  const revokeRole = async (userId: string, targetRole: "admin" | "editor") => {
    setBusy(true);
    setStatus(null);
    const response = await fetch("/api/admin/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: targetRole }),
    });
    setBusy(false);

    if (!response.ok) {
      setStatus("Failed to revoke role");
      return;
    }

    await load();
    setStatus("Role revoked");
  };

  return (
    <section className="card" data-testid="admin-roles-panel">
      <h3>Roles</h3>

      <div className="list">
        <label className="field">
          <span>User</span>
          <select
            className="select"
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            disabled={busy}
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName ? `${user.fullName} (${user.email})` : user.email}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Role</span>
          <select className="select" value={role} onChange={(event) => setRole(event.target.value as "admin" | "editor")} disabled={busy}>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </label>

        <button type="button" className="button button-primary" onClick={assignRole} disabled={busy} data-testid="assign-role-button">
          Assign role
        </button>

        {status ? <p className="muted">{status}</p> : null}
      </div>

      <div className="list" style={{ marginTop: 14 }}>
        {roles.map((item, index) => (
          <div className="answer-option" key={`${item.userId}-${item.role}`}>
            <div>
              <strong>{item.fullName ?? item.email ?? item.userId}</strong>
              <p className="muted">{item.email ?? item.userId}</p>
              <p className="muted">{item.role}</p>
            </div>
            <button
              type="button"
              className="button button-muted"
              onClick={() => revokeRole(item.userId, item.role)}
              disabled={busy}
              data-testid={`revoke-role-button-${index}`}
            >
              Revoke
            </button>
          </div>
        ))}
        {roles.length === 0 ? <p className="muted">No admin roles assigned.</p> : null}
      </div>
    </section>
  );
};
