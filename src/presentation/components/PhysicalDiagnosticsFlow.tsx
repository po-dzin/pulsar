"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/domain/psychosomatic/model";
import { signInWithGoogle } from "@/infrastructure/supabase/client";
import { physicalCategoryTitles, physicalTestByKey, physicalTests } from "@/domain/physical/catalog";
import type {
  PhysicalAnswers,
  PhysicalCategoryKey,
  PhysicalCategoryScore,
  PhysicalFullScore,
  PhysicalRiskFlag,
  PhysicalTestDefinition,
} from "@/domain/physical/model";
import { derivePhysicalLevel } from "@/domain/physical/interpretation";
import { physicalLevelMeta } from "@/domain/physical/levelMeta";
import { PrintPdfButton } from "@/presentation/components/PrintPdfButton";

const categoryVisual: Record<PhysicalCategoryKey, { icon: string; accent: string }> = {
  breathing: { icon: "🫁", accent: "var(--level-excellent)" },
  cardio_strength: { icon: "💪", accent: "var(--level-stable)" },
  strength_endurance: { icon: "🔥", accent: "var(--level-attention)" },
  flexibility: { icon: "🤸", accent: "var(--level-attention)" },
  coordination_balance: { icon: "⚖️", accent: "var(--level-stable)" },
};

const riskFlagLabels: Record<PhysicalRiskFlag, Record<Locale, string>> = {
  stress_ns: {
    ru: "⚠️ Стресс нервной системы (Генчи < 20 сек)",
    en: "⚠️ Nervous-system stress (Genchi < 20 sec)",
  },
  critical_breathing_imbalance: {
    ru: "❗ Критический дисбаланс дыхания (коэффициент <1.0 или >2.8)",
    en: "❗ Critical breathing imbalance (ratio <1.0 or >2.8)",
  },
  zone5_leg_swings: {
    ru: "⚠️ Зона 5 после Махов ногами",
    en: "⚠️ Zone 5 after Leg Swings",
  },
  shoulder_asymmetry: {
    ru: "⚠️ Асимметрия плеч",
    en: "⚠️ Shoulder asymmetry",
  },
  dynamic_balance_asymmetry: {
    ru: "⚠️ Асимметрия динамического баланса",
    en: "⚠️ Dynamic balance asymmetry",
  },
  static_balance_asymmetry: {
    ru: "⚠️ Асимметрия статического баланса",
    en: "⚠️ Static balance asymmetry",
  },
};

type Props = {
  isAuthenticated: boolean;
  locale: Locale;
  productsHref: string;
  consultationLabel: string;
  signInLabel: string;
  authRequiredToStartLabel: string;
  saveResultLabel: string;
  saveResultLoadingLabel: string;
};

const getCurrentCategoryTests = (category: PhysicalCategoryKey) =>
  physicalTests.filter((test) => test.category === category);

const isTestCompleted = (answers: Record<string, string>, test: PhysicalTestDefinition): boolean =>
  test.inputs.every((input) => {
    const value = answers[input.key];
    return typeof value === "string" && value.trim().length > 0;
  });

export const PhysicalDiagnosticsFlow = ({
  isAuthenticated,
  locale,
  productsHref,
  consultationLabel,
  signInLabel,
  authRequiredToStartLabel,
  saveResultLabel,
  saveResultLoadingLabel,
}: Props) => {
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PhysicalFullScore | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [committedTests, setCommittedTests] = useState(0);

  const currentTest = physicalTests[currentIndex];
  const currentCategoryTests = useMemo(
    () => (currentTest ? getCurrentCategoryTests(currentTest.category) : []),
    [currentTest]
  );
  const currentCategoryStep = useMemo(
    () => currentCategoryTests.findIndex((test) => test.key === currentTest?.key) + 1,
    [currentCategoryTests, currentTest]
  );
  const currentIsCompleted = useMemo(
    () => (currentTest ? isTestCompleted(answers, currentTest) : false),
    [answers, currentTest]
  );
  const progressPct = Math.round((committedTests / physicalTests.length) * 100);

  const signIn = async () => {
    setBusy(true);
    try {
      const nextPath = `${window.location.pathname}${window.location.search}`;
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      await signInWithGoogle(redirectTo);
    } finally {
      setBusy(false);
    }
  };

  const saveDraftIfNeeded = async (questionKey: string, answerValue: string) => {
    if (!isAuthenticated || !answerValue) {
      return;
    }

    await fetch("/api/diagnostics/physical/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        questionKey,
        answerValue,
        consentAcceptedAt: consent ? new Date().toISOString() : undefined,
      }),
    }).catch(() => undefined);
  };

  const selectScaleAnswer = async (questionKey: string, answerValue: string) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: answerValue }));
    await saveDraftIfNeeded(questionKey, answerValue);
  };

  const setNumberAnswer = (questionKey: string, answerValue: string) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: answerValue }));
  };

  const restart = () => {
    setResult(null);
    setStarted(false);
    setAnswers({});
    setSessionId(crypto.randomUUID());
    setCurrentIndex(0);
    setCommittedTests(0);
  };

  const commitCurrentTestAnswers = async () => {
    if (!currentTest) return;
    await Promise.all(
      currentTest.inputs.map((input) => {
        const value = answers[input.key] ?? "";
        return saveDraftIfNeeded(input.key, value);
      })
    );
  };

  const goNext = async () => {
    if (!currentTest || !currentIsCompleted) {
      return;
    }

    await commitCurrentTestAnswers();
    setCommittedTests((prev) => Math.max(prev, currentIndex + 1));

    if (currentIndex >= physicalTests.length - 1) {
      await submit();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const goBack = () => {
    if (currentIndex === 0) {
      setStarted(false);
      return;
    }
    setCurrentIndex((prev) => prev - 1);
  };

  const submit = async () => {
    const allCompleted = physicalTests.every((test) => isTestCompleted(answers, test));
    if (!allCompleted) {
      return;
    }

    const payloadAnswers = answers as PhysicalAnswers;

    if (!isAuthenticated) {
      await signIn();
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/diagnostics/physical/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers: payloadAnswers,
          consentAcceptedAt: consent ? new Date().toISOString() : undefined,
        }),
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setResult(data.result as PhysicalFullScore);
        setCommittedTests(physicalTests.length);
      }
    } finally {
      setBusy(false);
    }
  };

  const renderCategoryCard = (category: PhysicalCategoryScore) => {
    const levelMeta = physicalLevelMeta[category.level];
    const visual = categoryVisual[category.category];
    const categoryLabel = physicalCategoryTitles[category.category][locale];
    const breathingRatio =
      category.category === "breathing" && result
        ? Number(result.perInput.breathing_balance_ratio)
        : Number.NaN;
    const breathingScore =
      category.category === "breathing" && result
        ? Number(result.perInput.breathing_balance_pct)
        : Number.NaN;
    return (
      <div key={category.category} className="card physical-result-card">
        <h3 className="physical-result-heading">
          <span className="physical-result-icon">{visual.icon}</span>
          {categoryLabel}
        </h3>
        <p className="metric-line">
          {locale === "ru" ? "Оценка" : "Score"}: <strong>{category.overallPct}%</strong>
        </p>
        <p className="metric-line">
          {locale === "ru" ? "Уровень" : "Level"}:{" "}
          <span className="level-pill" data-tone={levelMeta.tone}>
            {levelMeta.emoji} {levelMeta.label[locale]}
          </span>
        </p>
        <ul className="metric-list">
          {category.tests.map((item) => (
            <li key={`${category.category}-${item.testKey}`} className="metric-list-item">
              {physicalTestByKey[item.testKey].title[locale]}:{" "}
              <strong className="metric-accent" style={{ ["--metric-accent" as string]: visual.accent }}>{item.overallPct}%</strong>{" "}
              <span className="muted">
                {physicalLevelMeta[derivePhysicalLevel(item.overallPct)].emoji}
              </span>
            </li>
          ))}
          {Number.isFinite(breathingRatio) && Number.isFinite(breathingScore) ? (
            <li className="metric-list-item">
              {locale === "ru" ? "Коэффициент баланса" : "Balance coefficient"}:{" "}
              <strong className="metric-accent" style={{ ["--metric-accent" as string]: visual.accent }}>{breathingScore}%</strong>{" "}
              <span className="muted">
                ({locale === "ru" ? "соотношение" : "ratio"} {breathingRatio.toFixed(2)}){" "}
                {physicalLevelMeta[derivePhysicalLevel(breathingScore)].emoji}
              </span>
            </li>
          ) : null}
        </ul>
      </div>
    );
  };

  if (result) {
    return (
      <section id="physical-result-export" className="diagnostics-result" data-testid="physical-result-card">
        <h2>{locale === "ru" ? "Итог физической диагностики" : "Physical diagnostics summary"}</h2>
        <p>
          {locale === "ru" ? "Общий результат" : "Overall result"}: <strong>{result.overallPct}%</strong>
        </p>
        <p>
          {locale === "ru" ? "Уровень" : "Level"}:{" "}
          <span className="level-pill" data-tone={physicalLevelMeta[result.level].tone}>
            {physicalLevelMeta[result.level].emoji} {physicalLevelMeta[result.level].label[locale]}
          </span>
        </p>

        <div className="grid cols-2 detail-grid">
          {result.categories.map(renderCategoryCard)}
        </div>

        {result.riskFlags.length > 0 ? (
          <div className="card detail-block-spaced">
            <h3>{locale === "ru" ? "Диагностические флаги" : "Diagnostic flags"}</h3>
            <ul className="detail-list-tight">
              {result.riskFlags.map((flag) => (
                <li key={flag}>{riskFlagLabels[flag][locale]}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="card detail-block-spaced">
          <h3>{locale === "ru" ? "Рекомендации" : "Recommendations"}</h3>
          {result.recommendations.map((block, idx) => (
            <div key={`${block.title[locale]}-${idx}`} className="profile-history-rec-block">
              <strong>{block.title[locale]}</strong>
              <ul className="detail-list-tight">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{item[locale]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="inline-row stack-top-md">
          <a href={productsHref} className="button button-primary button-page-cta" data-testid="physical-cta-products">
            {consultationLabel}
          </a>
          <button type="button" className="button button-muted button-page-cta" onClick={restart} data-testid="physical-retry">
            {locale === "ru" ? "Пройти заново" : "Retry full test"}
          </button>
          <PrintPdfButton
            label={saveResultLabel}
            loadingLabel={saveResultLoadingLabel}
            targetId="physical-result-export"
            filename={locale === "ru" ? "Pulsar_Physical_Result.pdf" : "Pulsar_Physical_Result_EN.pdf"}
            testId="physical-save-result-button"
          />
        </div>
      </section>
    );
  }

  if (!started) {
    return (
      <section className="card" data-testid="physical-full-intro">
        <h2>{locale === "ru" ? "Физический тест" : "Physical test"}</h2>
        <p>
          {locale === "ru"
            ? "Единый тест из 10 протоколов по 5 категориям. На выходе: оценка каждой категории, общий результат и персональные рекомендации."
            : "Single full test with 10 protocols across 5 categories. Output includes category scores, overall score, and recommendations."}
        </p>

        <ul className="category-list">
          <li>{categoryVisual.breathing.icon} {physicalCategoryTitles.breathing[locale]}</li>
          <li>{categoryVisual.cardio_strength.icon} {physicalCategoryTitles.cardio_strength[locale]}</li>
          <li>{categoryVisual.strength_endurance.icon} {physicalCategoryTitles.strength_endurance[locale]}</li>
          <li>{categoryVisual.flexibility.icon} {physicalCategoryTitles.flexibility[locale]}</li>
          <li>{categoryVisual.coordination_balance.icon} {physicalCategoryTitles.coordination_balance[locale]}</li>
        </ul>

        {!isAuthenticated ? (
          <div className="inline-row stack-top-md">
            <p className="muted inline-row-top">{authRequiredToStartLabel}</p>
            <button
              type="button"
              className="button button-primary button-page-cta"
              onClick={() => void signIn()}
              disabled={busy}
              data-testid="physical-signin-button"
            >
              {signInLabel}
            </button>
          </div>
        ) : (
          <>
            <label className="consent-row" data-selected={consent}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                data-testid="physical-consent-checkbox"
              />
              <span>
                {locale === "ru"
                  ? "Я согласен(на) на обработку диагностических данных для хранения результата и отслеживания прогресса."
                  : "I consent to processing diagnostics data for storing results and tracking progress."}
              </span>
            </label>

            <div className="inline-row stack-top-md">
              <button
                type="button"
                className="button button-primary button-page-cta"
                onClick={() => {
                  setStarted(true);
                  setCurrentIndex(0);
                  setCommittedTests(0);
                }}
                disabled={!consent}
                data-testid="physical-start-button"
              >
                {locale === "ru" ? "Начать тест" : "Start test"}
              </button>
            </div>
          </>
        )}
      </section>
    );
  }

  if (!currentTest) {
    return null;
  }

  return (
    <>
      <div className="progress-bar-wrapper">
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} data-testid="physical-progress-fill" />
        <span className="progress-bar-label" data-testid="physical-progress-label">{progressPct}%</span>
      </div>

      <section className="card physical-test-card">
        <p className="muted card-intro">
          {locale === "ru" ? "Категория" : "Category"}:{" "}
          <strong>
            {categoryVisual[currentTest.category].icon} {physicalCategoryTitles[currentTest.category][locale]}
          </strong>
        </p>
        <h2 data-testid="physical-step-title">
          {currentIndex + 1}/{physicalTests.length}: {currentTest.title[locale]}
        </h2>
        <p className="muted">
          {locale === "ru" ? "Тест в категории" : "Category test"}: {currentCategoryStep}/{currentCategoryTests.length}
        </p>
        <p className="muted">{currentTest.description[locale]}</p>

        <ol className="protocol-list">
          {currentTest.protocol[locale].map((step, idx) => (
            <li key={idx} className="protocol-list-item">{step}</li>
          ))}
        </ol>
      </section>

      <div className="questions-list physical-questions-list">
        {currentTest.inputs.map((input, index) => {
          const selected = answers[input.key] ?? "";
          return (
            <section key={input.key} className="question-card" data-answered={selected !== "" || undefined}>
              <div className="question-header">
                <span className="question-number">{index + 1}</span>
                <div>
                  <h3 className="question-title">{input.title[locale]}</h3>
                  <p className="muted">{input.hint[locale]}</p>
                </div>
              </div>

              {input.type === "number" ? (
                <div className="number-input-wrap">
                  <input
                    type="number"
                    min={input.min}
                    max={input.max}
                    step={input.step ?? 1}
                    value={selected}
                    onChange={(e) => setNumberAnswer(input.key, e.target.value)}
                    onBlur={(e) => void saveDraftIfNeeded(input.key, e.target.value)}
                    className="number-input"
                    placeholder={locale === "ru" ? "Введите значение" : "Enter value"}
                    data-testid={`physical-input-${input.key}`}
                  />
                </div>
              ) : (
                <div className="answer-grid answer-grid-offset">
                  {Object.entries(input.scaleLabels ?? {}).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className="answer-chip"
                      data-selected={selected === value || undefined}
                      onClick={() => void selectScaleAnswer(input.key, value)}
                      data-testid={`physical-scale-${input.key}-${value}`}
                    >
                      {label[locale]}
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="diagnostics-nav stack-top-lg">
        <button
          type="button"
          className="button button-muted button-page-cta"
          onClick={goBack}
          data-testid="physical-prev-test-button"
        >
          {locale === "ru" ? "Назад" : "Back"}
        </button>
        <button
          type="button"
          className="button button-primary button-page-cta"
          onClick={() => void goNext()}
          disabled={!currentIsCompleted || busy}
          data-testid={currentIndex >= physicalTests.length - 1 ? "physical-complete-button" : "physical-next-test-button"}
        >
          {currentIndex >= physicalTests.length - 1
            ? (locale === "ru" ? "Завершить и показать итог" : "Complete and show summary")
            : (locale === "ru" ? "Следующий тест" : "Next test")}
        </button>
      </div>
    </>
  );
};
