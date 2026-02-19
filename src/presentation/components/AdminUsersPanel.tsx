"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  fullName: string | null;
  locale: string;
};

export const AdminUsersPanel = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []));
  }, []);

  return (
    <section className="card" data-testid="admin-users-table">
      <h3>Users</h3>
      <div className="list">
        {users.map((user) => (
          <div className="answer-option" key={user.id}>
            <strong>{user.fullName ?? "User"}</strong>
            <span>{user.email}</span>
            <span className="muted">{user.locale}</span>
          </div>
        ))}
        {users.length === 0 ? <p className="muted">No users yet.</p> : null}
      </div>
    </section>
  );
};
