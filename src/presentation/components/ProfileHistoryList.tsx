"use client";

import { useState } from "react";
import type { Locale } from "@/domain/psychosomatic/model";
import { levelLabels, zoneLabels } from "@/domain/psychosomatic/questions";
import type { Dictionary } from "@/presentation/i18n/dictionaries";
import { physicalCategoryTitles, physicalTestByKey } from "@/domain/physical/catalog";
import { physicalLevelMeta } from "@/domain/physical/levelMeta";
import { PrintPdfButton } from "@/presentation/components/PrintPdfButton";

export type ZoneScore = { zone: string; score: number };
export type RecommendationBlock = {
    title: Record<string, string>;
    items: Array<Record<string, string>>;
};

export type HistoryItem = {
    id: string;
    testType: string;
    overallPct: number;
    level: string;
    createdAt: string;
    zones: ZoneScore[] | null;
    recommendations: RecommendationBlock[] | null;
};

type Props = {
    items: HistoryItem[];
    locale: Locale;
    dictionary: Dictionary;
};

const TEST_TYPE_LABELS: Record<string, Record<Locale, string>> = {
    psychosomatic_v1: {
        ru: "Психосоматический тест",
        en: "Psychosomatic test",
    },
    physical_full_v1: {
        ru: "Физический тест (полный)",
        en: "Physical test (full)",
    },
};

const resolveTestTypeLabel = (testType: string, locale: Locale): string => {
    const direct = TEST_TYPE_LABELS[testType]?.[locale];
    if (direct) return direct;

    const match = /^physical_(.+)_v1$/.exec(testType);
    if (!match) return testType;

    const physicalKey = match[1] as keyof typeof physicalTestByKey;
    const test = physicalTestByKey[physicalKey];
    if (!test) return testType;
    return test.title[locale];
};

/** Safely extract a localized string from an object like {en: "...", ru: "..."} */
const t = (obj: Record<string, string> | null | undefined, locale: Locale): string => {
    if (!obj || typeof obj !== "object") return "";
    return obj[locale] || obj["ru"] || obj["en"] || Object.values(obj)[0] || "";
};

const resolveZoneLabel = (zone: string, locale: Locale, testType: string): string => {
    if (testType.startsWith("physical_")) {
        const categoryLabel = physicalCategoryTitles[zone as keyof typeof physicalCategoryTitles]?.[locale];
        if (categoryLabel) return categoryLabel;
    }
    const psychoLabel = (zoneLabels[locale] as Record<string, string> | undefined)?.[zone];
    return psychoLabel || zone;
};

const resolveLocalizedLevel = (level: string, locale: Locale, testType: string): string => {
    if (testType.startsWith("physical_")) {
        const physical = physicalLevelMeta[level as keyof typeof physicalLevelMeta];
        if (physical) {
            return `${physical.emoji} ${physical.label[locale]}`;
        }
    }

    return levelLabels[locale]?.[level] || level;
};

const resolveLevelTone = (level: string, testType: string): string | undefined => {
    if (!testType.startsWith("physical_")) return undefined;
    const physical = physicalLevelMeta[level as keyof typeof physicalLevelMeta];
    return physical?.tone;
};

export const ProfileHistoryList = ({ items, locale, dictionary }: Props) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "psychosomatic" | "physical">("all");

    if (items.length === 0) {
        return <p className="muted" style={{ marginTop: "var(--space-2)" }}>{dictionary.profile.noHistory}</p>;
    }

    const filteredItems = items.filter((item) => {
        if (filter === "all") return true;
        if (filter === "psychosomatic") return item.testType === "psychosomatic_v1";
        return item.testType.startsWith("physical_");
    });

    const toggleExpand = (id: string) => {
        // Accordion: opening one closes any previously open card
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="grid" style={{ marginTop: "var(--space-3)", gap: "12px" }}>
            <div className="test-selector" style={{ marginTop: 0 }}>
                <button
                    type="button"
                    className="test-selector-tab"
                    data-active={filter === "all" || undefined}
                    onClick={() => setFilter("all")}
                    data-testid="profile-filter-all"
                >
                    {locale === "ru" ? "Все" : "All"}
                </button>
                <button
                    type="button"
                    className="test-selector-tab"
                    data-active={filter === "psychosomatic" || undefined}
                    onClick={() => setFilter("psychosomatic")}
                    data-testid="profile-filter-psychosomatic"
                >
                    {locale === "ru" ? "Психосоматика" : "Psychosomatic"}
                </button>
                <button
                    type="button"
                    className="test-selector-tab"
                    data-active={filter === "physical" || undefined}
                    onClick={() => setFilter("physical")}
                    data-testid="profile-filter-physical"
                >
                    {locale === "ru" ? "Физические" : "Physical"}
                </button>
            </div>

            {filteredItems.map((item, index) => {
                const isExpanded = expandedId === item.id;
                const localizedLevel = resolveLocalizedLevel(item.level, locale, item.testType);
                const levelTone = resolveLevelTone(item.level, item.testType);
                const testName = resolveTestTypeLabel(item.testType, locale);

                const dateStr = new Date(item.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                });

                // Zones stored as a flat ZoneScore[] — split by score threshold
                const zonesArr: ZoneScore[] = Array.isArray(item.zones) ? item.zones : [];
                const zonesStrong = zonesArr.filter(z => z.score >= 70);
                const zonesGrowth = zonesArr.filter(z => z.score < 70);
                const recommendations: RecommendationBlock[] = Array.isArray(item.recommendations) ? item.recommendations : [];

                return (
                    <div
                        key={item.id}
                        className="card"
                        data-testid={`profile-history-card-${index}`}
                        style={{ overflow: "hidden", padding: 0, transition: "all 0.25s ease" }}
                    >
                        {/* ── Header row — always visible, click to toggle ── */}
                        <div
                            style={{
                                padding: "14px 18px",
                                cursor: "pointer",
                            }}
                            onClick={() => toggleExpand(item.id)}
                            data-testid={`profile-history-toggle-${index}`}
                        >
                            {/* Test name */}
                            <span style={{ fontWeight: 600, fontSize: "0.88rem", display: "block", marginBottom: "8px" }}>
                                {testName}
                            </span>

                            {/* Stable 4-col grid: date | % | level | chevron */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(88px, max-content) 52px 1fr 20px",
                                alignItems: "center",
                                gap: "0 10px",
                            }}>
                                {/* Date — always one line */}
                                <span className="muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {dateStr}
                                </span>

                                {/* % score — fixed width, right-aligned */}
                                <strong style={{ fontSize: "1rem", textAlign: "right" }}>
                                    {item.overallPct}%
                                </strong>

                                {/* Level label — fills remaining space, truncates if long */}
                                <span style={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {dictionary.profile.level}:{" "}
                                    {levelTone ? (
                                        <span className="level-pill" data-tone={levelTone}>{localizedLevel}</span>
                                    ) : (
                                        <span className="muted">{localizedLevel}</span>
                                    )}
                                </span>

                                {/* Chevron */}
                                <svg
                                    width="14" height="14" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    style={{
                                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s ease",
                                        color: "var(--color-text-muted)",
                                        flexShrink: 0,
                                        justifySelf: "end",
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>


                        {/* ── Expanded detail panel ── */}
                        {isExpanded && (
                            <div id={`pdf-content-${item.id}`} style={{ borderTop: "1px solid var(--color-border)", padding: "20px" }}>

                                {/* ── PDF metadata header ── */}

                                <div style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "baseline",
                                    gap: "8px 18px",
                                    paddingBottom: "14px",
                                    marginBottom: "18px",
                                    borderBottom: "1px solid var(--color-border)",
                                }}>
                                    <span style={{ fontWeight: 700, fontSize: "1rem" }}>{testName}</span>
                                    <span className="muted" style={{ fontSize: "0.85rem" }}>{dateStr}</span>
                                    <span style={{
                                        fontSize: "0.82rem",
                                        padding: "2px 10px",
                                        borderRadius: "20px",
                                        background: "rgba(128,128,128,0.1)",
                                        border: "1px solid var(--color-border)",
                                        color: "var(--color-text-muted)",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {item.overallPct}% ·{" "}
                                        {levelTone ? (
                                            <span className="level-pill" data-tone={levelTone}>{localizedLevel}</span>
                                        ) : (
                                            localizedLevel
                                        )}
                                    </span>
                                </div>


                                <div className="grid cols-2" style={{ marginBottom: "20px", gap: "10px" }}>
                                    <div style={{ background: "rgba(128,128,128,0.06)", padding: "14px", borderRadius: "8px" }}>
                                        <h4 style={{ margin: "0 0 10px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
                                            {dictionary.result.strong}
                                        </h4>
                                        {zonesStrong.length === 0 ? (
                                            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>—</p>
                                        ) : (
                                            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.88rem" }}>
                                                {zonesStrong.map((z) => (
                                                    <li key={z.zone} style={{ marginBottom: "4px" }}>
                                                        {resolveZoneLabel(z.zone, locale, item.testType)}: <strong>{z.score}%</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div style={{ background: "rgba(128,128,128,0.06)", padding: "14px", borderRadius: "8px" }}>
                                        <h4 style={{ margin: "0 0 10px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
                                            {dictionary.result.growth}
                                        </h4>
                                        {zonesGrowth.length === 0 ? (
                                            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>—</p>
                                        ) : (
                                            <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.88rem" }}>
                                                {zonesGrowth.map((z) => (
                                                    <li key={z.zone} style={{ marginBottom: "4px" }}>
                                                        {resolveZoneLabel(z.zone, locale, item.testType)}: <strong>{z.score}%</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Recommendations */}
                                {recommendations.length > 0 && (
                                    <div style={{ marginBottom: "20px" }}>
                                        <h4 style={{ margin: "0 0 14px", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>
                                            {dictionary.result.recommendations}
                                        </h4>
                                        {recommendations.map((block, idx) => (
                                            <div key={idx} style={{ marginBottom: "14px" }}>
                                                <strong style={{ display: "block", marginBottom: "8px", fontSize: "0.92rem" }}>
                                                    {t(block.title, locale)}
                                                </strong>
                                                {Array.isArray(block.items) && block.items.length > 0 && (
                                                    <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.88rem", color: "var(--color-text-muted)" }}>
                                                        {block.items.map((recItem, recIdx) => {
                                                            const text = t(recItem, locale);
                                                            return text ? (
                                                                <li key={recIdx} style={{ marginBottom: "5px" }}>{text}</li>
                                                            ) : null;
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Per-card PDF download */}
                                <div className="print-hidden">
                                    <PrintPdfButton
                                        targetId={`pdf-content-${item.id}`}
                                        label={dictionary.profile.download}
                                        loadingLabel={dictionary.profile.downloadLoading}
                                        filename={`Impulse_${item.testType}_${item.createdAt.slice(0, 10)}.pdf`}
                                        testId={`profile-download-${index}`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            {filteredItems.length === 0 ? <p className="muted">{locale === "ru" ? "Нет результатов в выбранном фильтре." : "No results for selected filter."}</p> : null}
        </div>
    );
};
