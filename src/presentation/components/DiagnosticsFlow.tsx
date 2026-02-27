"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Locale, AnswerValue, PsychoAnswers, PsychoScore } from "@/domain/psychosomatic/model";
import { psychosomaticQuestions, getQuestionOptions, levelLabels, zoneLabels } from "@/domain/psychosomatic/questions";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { PhysicalDiagnosticsFlow } from "@/presentation/components/PhysicalDiagnosticsFlow";

type Props = {
  isAuthenticated: boolean;
  locale: Locale;
  labels: {
    description: string;
    consent: string;
    start: string;
    next: string;
    finish: string;
    restart: string;
    resultTitle: string;
    overallLabel: string;
    levelLabel: string;
    strongLabel: string;
    growthLabel: string;
    recommendationsLabel: string;
    toProducts: string;
    toKnowledge: string;
    historyTitle: string;
    historyGuestEmpty: string;
    authRequiredToStart: string;
    signIn: string;
    saveResult: string;
    saveResultLoading: string;
    testSelectorPsychosomatic: string;
    testSelectorPhysical: string;
  };
  productsHref: string;
  knowledgeHref: string;
  initialHistory: Array<{ id: string; overallPct: number; level: string; createdAt: string }>;
};

const orderedAnswers: AnswerValue[] = ["none", "rare", "sometimes", "often"];

export const DiagnosticsFlow = ({ isAuthenticated, locale, labels, productsHref, knowledgeHref, initialHistory }: Props) => {
  const [activeFlow, setActiveFlow] = useState<"psychosomatic" | "physical">("psychosomatic");
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Partial<PsychoAnswers>>({});
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<PsychoScore | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    const supabase = getSupabaseBrowserClient();
    const nextPath = `${window.location.pathname}${window.location.search}`;
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    setBusy(false);
  };
  const questionRefs = useRef<Map<number, HTMLElement>>(new Map());

  const answeredCount = useMemo(
    () => psychosomaticQuestions.filter((q) => answers[q.key] !== undefined).length,
    [answers]
  );
  const progressPct = useMemo(
    () => Math.round((answeredCount / psychosomaticQuestions.length) * 100),
    [answeredCount]
  );
  const allAnswered = answeredCount === psychosomaticQuestions.length;

  const selectAnswer = useCallback(
    (key: string, value: AnswerValue) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));

      // Auto-scroll to next unanswered question
      const currentIndex = psychosomaticQuestions.findIndex((q) => q.key === key);
      const nextUnanswered = psychosomaticQuestions.findIndex(
        (q, i) => i > currentIndex && !(key === q.key || answers[q.key] !== undefined)
      );
      if (nextUnanswered !== -1) {
        setTimeout(() => {
          const el = questionRefs.current.get(nextUnanswered);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      }

      // Save draft for authenticated users
      if (isAuthenticated) {
        fetch("/api/diagnostics/psychosomatic/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionKey: key,
            answerKey: value,
            consentAcceptedAt: consent ? new Date().toISOString() : undefined,
          }),
        }).catch(() => { });
      }
    },
    [answers, consent, isAuthenticated, sessionId]
  );

  const handleSubmit = async () => {
    if (!allAnswered) return;

    if (!isAuthenticated) {
      await signIn();
      return;
    }

    const payloadAnswers = answers as PsychoAnswers;

    setBusy(true);
    try {
      const response = await fetch("/api/diagnostics/psychosomatic/complete", {
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
        setResult(data.result as PsychoScore);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRestart = () => {
    setResult(null);
    setStarted(false);
    setAnswers({});
    setSessionId(crypto.randomUUID());
  };

  if (activeFlow === "physical") {
    return (
      <>
        <div className="test-selector">
          <button
            type="button"
            className="test-selector-tab"
            onClick={() => setActiveFlow("psychosomatic")}
            data-testid="flow-tab-psychosomatic"
          >
            {labels.testSelectorPsychosomatic}
          </button>
          <button type="button" className="test-selector-tab" data-active={true} data-testid="flow-tab-physical">
            {labels.testSelectorPhysical}
          </button>
        </div>
        <PhysicalDiagnosticsFlow
          isAuthenticated={isAuthenticated}
          locale={locale}
          productsHref={productsHref}
          consultationLabel={labels.toProducts}
          signInLabel={labels.signIn}
          authRequiredToStartLabel={labels.authRequiredToStart}
          saveResultLabel={labels.saveResult}
          saveResultLoadingLabel={labels.saveResultLoading}
        />
      </>
    );
  }

  /* ── Result view ─────────────────────────────────────────── */
  if (result) {
    return (
      <>
        <div className="test-selector">
          <button type="button" className="test-selector-tab" data-active={true} data-testid="flow-tab-psychosomatic">
            {labels.testSelectorPsychosomatic}
          </button>
          <button
            type="button"
            className="test-selector-tab"
            onClick={() => setActiveFlow("physical")}
            data-testid="flow-tab-physical"
          >
            {labels.testSelectorPhysical}
          </button>
        </div>
        <section className="diagnostics-result" data-testid="result-card">
          <h2>{labels.resultTitle}</h2>
          <p data-testid="result-overall-pct">
            {labels.overallLabel}: <strong>{result.overallPct}%</strong>
          </p>
          <p data-testid="result-level">
            {labels.levelLabel}: <strong>{levelLabels[locale][result.level]}</strong>
          </p>

          <div className="grid cols-2" style={{ gap: 12, marginTop: 16 }}>
            <div className="card" style={{ padding: 14 }}>
              <h3>{labels.strongLabel}</h3>
              <ul>
                {result.zonesStrong.map((zone) => (
                  <li key={`strong-${zone.zone}`}>
                    {zoneLabels[locale][zone.zone]}: {zone.score}%
                  </li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <h3>{labels.growthLabel}</h3>
              <ul>
                {result.zonesGrowth.map((zone) => (
                  <li key={`growth-${zone.zone}`}>
                    {zoneLabels[locale][zone.zone]}: {zone.score}%
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card" style={{ padding: 16, marginTop: 12 }} data-testid="result-recommendations">
            <h3>{labels.recommendationsLabel}</h3>
            {result.recommendations.map((block, idx) => (
              <div key={idx} style={{ marginTop: idx > 0 ? 14 : 10 }}>
                <strong>{block.title[locale]}</strong>
                <ul style={{ marginTop: 6, marginBottom: 0 }}>
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx}>{item[locale]}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="inline-row" style={{ marginTop: 16 }}>
            <a href={productsHref} className="button button-primary" data-testid="cta-go-products">
              {labels.toProducts}
            </a>
            <a href={knowledgeHref} className="button button-muted">
              {labels.toKnowledge}
            </a>
            <button
              type="button"
              className="button button-muted"
              onClick={handleRestart}
              data-testid="restart-button"
            >
              {labels.restart}
            </button>
            <button
              type="button"
              className="button button-muted"
              onClick={() => setActiveFlow("physical")}
            >
              {labels.testSelectorPhysical}
            </button>
          </div>
        </section>
      </>
    );
  }

  /* ── Pre-start: consent + description ────────────────────── */
  if (!started) {
    return (
      <>
        {/* Test selector */}
        <div className="test-selector">
          <button type="button" className="test-selector-tab" data-active={true} data-testid="flow-tab-psychosomatic">
            {labels.testSelectorPsychosomatic}
          </button>
          <button
            type="button"
            className="test-selector-tab"
            onClick={() => setActiveFlow("physical")}
            data-testid="flow-tab-physical"
          >
            {labels.testSelectorPhysical}
          </button>
        </div>

        <section className="card">
          <h2>{labels.testSelectorPsychosomatic}</h2>
          <p style={{ whiteSpace: "pre-line" }}>{labels.description}</p>

          {!isAuthenticated ? (
            <div className="inline-row" style={{ marginTop: 12 }}>
              <p className="muted" style={{ width: "100%", marginBottom: 8 }}>{labels.authRequiredToStart}</p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => void signIn()}
                disabled={busy}
                data-testid="start-psychotest-button"
              >
                {labels.signIn}
              </button>
            </div>
          ) : (
            <>
              <label className="consent-row" data-selected={consent}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  data-testid="consent-checkbox"
                />
                <span>{labels.consent}</span>
              </label>

              <div className="inline-row" style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setStarted(true)}
                  disabled={!consent}
                  data-testid="start-psychotest-button"
                >
                  {labels.start}
                </button>
              </div>
            </>
          )}
        </section>
      </>
    );
  }

  /* ── Questions list (all visible, scrollable) ────────────── */
  return (
    <>
      {/* Test selector */}
      <div className="test-selector">
        <button
          type="button"
          className="test-selector-tab"
          data-active={true}
          data-testid="flow-tab-psychosomatic"
        >
          {labels.testSelectorPsychosomatic}
        </button>
        <button
          type="button"
          className="test-selector-tab"
          onClick={() => setActiveFlow("physical")}
          data-testid="flow-tab-physical"
        >
          {labels.testSelectorPhysical}
        </button>
      </div>

      {/* Progress bar */}
      <div className="progress-bar-wrapper">
        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        <span className="progress-bar-label">{progressPct}%</span>
      </div>

      {/* All questions */}
      <div className="questions-list">
        {psychosomaticQuestions.map((question, index) => {
          // Step-by-step reveal: only show if previous are answered
          if (index > answeredCount) return null;

          const options = getQuestionOptions(question, locale);
          const selected = answers[question.key];
          return (
            <section
              key={question.key}
              className="question-card"
              data-answered={selected !== undefined || undefined}
              ref={(el) => {
                if (el) questionRefs.current.set(index, el);
              }}
            >
              <div className="question-header">
                <span className="question-number">{index + 1}</span>
                <div>
                  <h3 className="question-title">{question.title[locale]}</h3>
                  <p className="question-hint muted">{question.hint[locale]}</p>
                </div>
              </div>
              <div className="answer-row">
                {orderedAnswers.map((value, answerIndex) => (
                  <button
                    key={value}
                    type="button"
                    className="answer-pill"
                    data-selected={selected === value || undefined}
                    onClick={() => selectAnswer(question.key, value)}
                    data-testid={`answer-option-${index}-${answerIndex}`}
                  >
                    {options[value]}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Submit button */}
      <div className="inline-row" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="button button-primary"
          onClick={handleSubmit}
          disabled={!allAnswered || busy}
          data-testid="question-next-button"
        >
          {labels.finish}
        </button>
      </div>

      {/* History */}
      <section style={{ marginTop: 24 }}>
        <h3>{labels.historyTitle}</h3>
        <div className="list">
          {!isAuthenticated ? <p className="muted">{labels.historyGuestEmpty}</p> : null}
          {isAuthenticated
            ? initialHistory.slice(0, 5).map((item) => (
              <div key={item.id} className="answer-option">
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                <strong>{item.overallPct}%</strong>
                <span className="muted">{item.level}</span>
              </div>
            ))
            : null}
          {isAuthenticated && initialHistory.length === 0 ? <p className="muted">No history yet.</p> : null}
        </div>
      </section>
    </>
  );
};
