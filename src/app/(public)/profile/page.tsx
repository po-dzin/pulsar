import { redirect } from "next/navigation";
import { getViewContext } from "@/presentation/i18n/getViewContext";
import { PageScaffold } from "@/presentation/components/PageScaffold";
import { createRuntime } from "@/infrastructure/repositories/factory/createRuntime";
import Image from "next/image";
import { ProfileHistoryList } from "@/presentation/components/ProfileHistoryList";
import type { HistoryItem, RecommendationBlock, ZoneScore } from "@/presentation/components/ProfileHistoryList";

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
    let history: HistoryItem[] = [];
    try {
        const runtime = await createRuntime();
        const rows = await runtime.diagnosticsRepo.listResultsByUser(context.userId);

        const asZoneScores = (value: unknown): ZoneScore[] | null => {
            if (!Array.isArray(value)) return null;
            const filtered = value.filter((item): item is ZoneScore => {
                if (!item || typeof item !== "object") return false;
                const zone = (item as { zone?: unknown }).zone;
                const score = (item as { score?: unknown }).score;
                return typeof zone === "string" && typeof score === "number";
            });
            return filtered.length > 0 ? filtered : null;
        };

        const asRecommendations = (value: unknown): RecommendationBlock[] | null => {
            if (!Array.isArray(value)) return null;
            return value as RecommendationBlock[];
        };

        history = rows.map((row) => ({
            id: row.id,
            testType: row.testType,
            overallPct: row.overallPct,
            level: row.level,
            createdAt: row.createdAt,
            zones: asZoneScores(row.zones),
            recommendations: asRecommendations(row.recommendations),
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
            {/* ── PDF-printable content ── */}
            <div id="pdf-content">
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
                                suppressHydrationWarning
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
                    <ProfileHistoryList items={history} locale={context.locale} dictionary={d} />
                </section>
            </div>
        </PageScaffold>
    );
}
