"use client";

import type { ReactNode } from "react";

type Column = {
  key: string;
  label: string;
  className?: string;
};

type Props = {
  columns: Column[];
  hasRows: boolean;
  emptyMessage: string;
  children: ReactNode;
  testId?: string;
};

export const AdminTable = ({ columns, hasRows, emptyMessage, children, testId }: Props) => {
  return (
    <div className="admin-table-shell" data-testid={testId}>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.className}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {!hasRows ? <p className="muted admin-empty-message">{emptyMessage}</p> : null}
    </div>
  );
};
