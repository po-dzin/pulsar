"use client";

type Props = {
  expanded: boolean;
  onToggle: () => void;
  label?: string;
  iconOnly?: boolean;
  testId?: string;
  ariaLabel?: string;
};

export const AdminRowExpand = ({
  expanded,
  onToggle,
  label = "Details",
  iconOnly = false,
  testId,
  ariaLabel,
}: Props) => {
  if (iconOnly) {
    return (
      <button
        type="button"
        className="button button-muted admin-expand-btn admin-expand-btn-icon"
        onClick={onToggle}
        aria-label={ariaLabel ?? (expanded ? "Collapse row details" : "Expand row details")}
        data-testid={testId}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="admin-chevron"
          data-expanded={expanded || undefined}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }

  return (
    <button type="button" className="button button-muted admin-expand-btn admin-table-action-btn" onClick={onToggle} data-testid={testId}>
      {expanded ? "Hide" : label}
    </button>
  );
};
