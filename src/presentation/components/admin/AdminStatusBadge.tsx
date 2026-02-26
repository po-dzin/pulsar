"use client";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

type Props = {
  label: string;
  tone?: Tone;
};

export const AdminStatusBadge = ({ label, tone = "neutral" }: Props) => {
  return (
    <span className="admin-status-badge" data-tone={tone}>
      {label}
    </span>
  );
};
