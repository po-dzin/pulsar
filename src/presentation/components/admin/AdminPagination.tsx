"use client";

type Props = {
  page: number;
  totalPages: number;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const Chevron = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="admin-pagination-chevron"
    aria-hidden="true"
  >
    {direction === "left" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

export const AdminPagination = ({ page, totalPages, disabled = false, onPrev, onNext }: Props) => {
  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="button button-muted admin-pagination-btn"
        onClick={onPrev}
        disabled={disabled || page <= 1}
        aria-label="Previous page"
        data-testid="admin-pagination-prev"
      >
        <Chevron direction="left" />
      </button>
      <span className="muted">Page {page} / {totalPages}</span>
      <button
        type="button"
        className="button button-muted admin-pagination-btn"
        onClick={onNext}
        disabled={disabled || page >= totalPages}
        aria-label="Next page"
        data-testid="admin-pagination-next"
      >
        <Chevron direction="right" />
      </button>
    </div>
  );
};
