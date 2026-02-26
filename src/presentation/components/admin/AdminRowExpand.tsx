"use client";

type Props = {
  expanded: boolean;
  onToggle: () => void;
  label?: string;
};

export const AdminRowExpand = ({ expanded, onToggle, label = "Details" }: Props) => {
  return (
    <button type="button" className="button button-muted admin-expand-btn" onClick={onToggle}>
      {expanded ? "Hide" : label}
    </button>
  );
};
