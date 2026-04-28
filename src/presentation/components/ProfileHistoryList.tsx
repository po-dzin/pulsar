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
        return <p className="muted profile-history-empty">{dictionary.profile.noHistory}</p>;
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
        <div className="grid profile-history-list">
            <div className="test-selector profile-history-filters">
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
                        className="card profile-history-card"
                        data-testid={`profile-history-card-${index}`}
                    >
                        {/* ── Header row — always visible, click to toggle ── */}
                        <div
                            className="profile-history-card-toggle"
                            onClick={() => toggleExpand(item.id)}
                            data-testid={`profile-history-toggle-${index}`}
                        >
                            <span className="profile-history-name">{testName}</span>
                            <span className="profile-history-date muted">{dateStr}</span>
                            <strong className="profile-history-percent">{item.overallPct}%</strong>
                            <span className="profile-history-level">
                                {levelTone ? (
                                    <span className="level-pill" data-tone={levelTone}>{localizedLevel}</span>
                                ) : (
                                    <span className="muted">{localizedLevel}</span>
                                )}
                            </span>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="profile-history-chevron"
                                data-expanded={isExpanded || undefined}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </div>


                        {/* ── Expanded detail panel ── */}
                        {isExpanded && (
                            <div id={`pdf-content-${item.id}`} className="profile-history-detail">
                                <div className="grid cols-2 profile-history-summary-grid">
                                    <div className="profile-history-summary-block">
                                        <h4 className="profile-history-section-title">
                                            {dictionary.result.strong}
                                        </h4>
                                        {zonesStrong.length === 0 ? (
                                            <p className="muted profile-history-empty-state">—</p>
                                        ) : (
                                            <ul className="profile-history-zone-list">
                                                {zonesStrong.map((z) => (
                                                    <li key={z.zone} className="profile-history-zone-item">
                                                        {resolveZoneLabel(z.zone, locale, item.testType)}: <strong>{z.score}%</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="profile-history-summary-block">
                                        <h4 className="profile-history-section-title">
                                            {dictionary.result.growth}
                                        </h4>
                                        {zonesGrowth.length === 0 ? (
                                            <p className="muted profile-history-empty-state">—</p>
                                        ) : (
                                            <ul className="profile-history-zone-list">
                                                {zonesGrowth.map((z) => (
                                                    <li key={z.zone} className="profile-history-zone-item">
                                                        {resolveZoneLabel(z.zone, locale, item.testType)}: <strong>{z.score}%</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Recommendations */}
                                {recommendations.length > 0 && (
                                    <div className="profile-history-recommendations">
                                        <h4 className="profile-history-section-title">
                                            {dictionary.result.recommendations}
                                        </h4>
                                        {recommendations.map((block, idx) => (
                                            <div key={idx} className="profile-history-rec-block">
                                                <strong className="profile-history-rec-heading">
                                                    {t(block.title, locale)}
                                                </strong>
                                                {Array.isArray(block.items) && block.items.length > 0 && (
                                                    <ul className="profile-history-rec-list muted">
                                                        {block.items.map((recItem, recIdx) => {
                                                            const text = t(recItem, locale);
                                                            return text ? (
                                                                <li key={recIdx} className="profile-history-rec-item">{text}</li>
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
                                        filename={`Pulsar_${item.testType}_${item.createdAt.slice(0, 10)}.pdf`}
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
