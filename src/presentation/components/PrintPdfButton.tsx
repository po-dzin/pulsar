"use client";

import { useCallback, useState } from "react";

type Props = {
    label: string;
    loadingLabel?: string;
    /** ID of the element to capture. Defaults to '#pdf-content', then '.main' */
    targetId?: string;
    /** Filename for the downloaded PDF */
    filename?: string;
    testId?: string;
};

export const PrintPdfButton = ({
    label,
    loadingLabel = "Loading...",
    targetId,
    filename = "Impulse_Diagnostics.pdf",
    testId = "download-pdf-button",
}: Props) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = useCallback(async () => {
        setIsGenerating(true);
        try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
                import("html2canvas"),
                import("jspdf"),
            ]);

            // Target a specific element by ID if provided, then fallback chain
            const selector = targetId ? `#${targetId}` : "#pdf-content";
            const targetElement = (document.querySelector(selector) as HTMLElement)
                || (document.querySelector(".main") as HTMLElement)
                || document.body;

            const canvas = await html2canvas(targetElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                windowWidth: 1200,
                onclone: (clonedDoc) => {
                    clonedDoc.body.classList.add("pdf-exporting");
                    const hiddenElements = clonedDoc.querySelectorAll(".print-hidden, .topbar, .footer, .admin-topbar");
                    hiddenElements.forEach(el => (el as HTMLElement).style.display = "none");
                },
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(filename);

        } catch (error) {
            console.error("Failed to generate PDF", error);
        } finally {
            setIsGenerating(false);
        }
    }, [targetId, filename]);

    return (
        <button
            type="button"
            className="button button-muted print-hidden"
            onClick={handleDownload}
            disabled={isGenerating}
            style={{ fontSize: "0.85rem" }}
            data-testid={testId}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: 6 }}
            >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {isGenerating ? loadingLabel : label}
        </button>
    );
};
