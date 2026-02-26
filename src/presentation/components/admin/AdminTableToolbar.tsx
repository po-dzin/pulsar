"use client";

import type { ReactNode } from "react";

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
};

export const AdminTableToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  leftSlot,
  rightSlot,
}: Props) => {
  return (
    <div className="admin-toolbar">
      <div className="admin-toolbar-left">
        {leftSlot}
        <input
          className="input"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="admin-toolbar-right">{rightSlot}</div>
    </div>
  );
};
