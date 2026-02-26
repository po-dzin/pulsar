"use client";

import { useEffect, useRef } from "react";

type Props = {
    title: string;
    body: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
};

export const ConfirmDialog = ({
    title,
    body,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    danger = true,
}: Props) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const handle = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        document.addEventListener("keydown", handle);
        return () => document.removeEventListener("keydown", handle);
    }, [onCancel]);

    return (
        <div
            className="confirm-dialog-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            data-testid="confirm-dialog"
            onClick={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div className="confirm-dialog" ref={dialogRef}>
                <h3 id="confirm-title" className="confirm-dialog-title">{title}</h3>
                <p className="confirm-dialog-body muted">{body}</p>
                <div className="confirm-dialog-actions">
                    <button
                        type="button"
                        className="button button-muted"
                        onClick={onCancel}
                        data-testid="confirm-dialog-cancel"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`button ${danger ? "button-danger" : "button-primary"}`}
                        onClick={onConfirm}
                        data-testid="confirm-dialog-confirm"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
