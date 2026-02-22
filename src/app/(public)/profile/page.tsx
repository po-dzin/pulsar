import { redirect } from "next/navigation";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { getPsychoHistoryUseCase } from "@/application/diagnostics/usecases/getPsychoHistory";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ lang?: string }>;
}) {
    const params = await searchParams;
    const context = await getViewContext("/profile", params.lang);
    const d = context.dictionary;

    // Require authentication — redirect guests to home
    if (!context.userId) {
        redirect("/");
    }

    // Fetch test history
    let history: Array<{ id: string; overallPct: number; level: string; createdAt: string }> = [];
    try {
        const runtime = await createRuntime();
        const execute = getPsychoHistoryUseCase(runtime.diagnosticsRepo);
        const rows = await execute(context.userId);
        history = rows.map((row) => ({
            id: row.id,
            overallPct: row.overallPct,
            level: row.level,
            createdAt: row.createdAt,
        }));
    } catch {
        history = [];
    }

    return (
        <PageScaffold
            locale={context.locale}
            dictionary={d}
            pathname={context.pathname}
            isAuthenticated={true}
            avatarUrl={context.avatarUrl}
            displayName={context.displayName}
        >
            {/* ── Profile header card ── */}
            <div className="profile-header card">
                <div className="profile-avatar-wrap">
                    {context.avatarUrl ? (
                        <Image
                            src={context.avatarUrl}
                            alt={context.displayName ?? "Avatar"}
                            width={80}
                            height={80}
                            className="profile-avatar-lg"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="profile-avatar-initials-lg">
                            {(context.displayName ?? "?")
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="profile-name">{context.displayName ?? d.profile.title}</h1>
                </div>
            </div>

            {/* ── Test history ── */}
            <section style={{ marginTop: "var(--space-4)" }}>
                <h2 className="profile-section-title">{d.profile.history}</h2>

                {history.length === 0 ? (
                    <p className="muted" style={{ marginTop: "var(--space-2)" }}>{d.profile.noHistory}</p>
                ) : (
                    <div className="grid" style={{ marginTop: "var(--space-3)" }}>
                        {history.map((item) => (
                            <div key={item.id} className="card profile-history-row">
                                <span className="muted" style={{ fontSize: "0.85rem" }}>
                                    {new Date(item.createdAt).toLocaleDateString(context.locale === "ru" ? "ru-RU" : "en-US", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </span>
                                <div className="profile-history-score">
                                    <strong>{item.overallPct}%</strong>
                                    <span className="muted">{d.profile.level}: {item.level}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── PDF download ── */}
            {history.length > 0 && (
                <div style={{ marginTop: "var(--space-4)" }}>
                    <button
                        type="button"
                        className="button button-muted"
                        onClick={undefined}
                        data-action="print"
                    >
                        {d.profile.download}
                    </button>
                </div>
            )}
        </PageScaffold>
    );
}
