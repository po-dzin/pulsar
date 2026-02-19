"use client";

import { useMemo, useState } from "react";
import type { Locale, AnswerValue, PsychoAnswers, PsychoScore } from "@/domain/psychosomatic/model";
import { psychosomaticQuestions, getQuestionOptions, levelLabels, zoneLabels } from "@/domain/psychosomatic/questions";

type Props = {
  locale: Locale;
  labels: {
    consent: string;
    start: string;
    next: string;
    finish: string;
    resultTitle: string;
    overallLabel: string;
    levelLabel: string;
    strongLabel: string;
    growthLabel: string;
    recommendationsLabel: string;
    toProducts: string;
    toKnowledge: string;
    historyTitle: string;
  };
  productsHref: string;
  knowledgeHref: string;
  initialHistory: Array<{ id: string; overallPct: number; level: string; createdAt: string }>;
};

const orderedAnswers: AnswerValue[] = ["none", "rare", "sometimes", "often"];

export const DiagnosticsFlow = ({ locale, labels, productsHref, knowledgeHref, initialHistory }: Props) => {
  const [consent, setConsent] = useState(false);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<PsychoAnswers>>({});
  const [sessionId] = useState(() => crypto.randomUUID());
  const [result, setResult] = useState<PsychoScore | null>(null);
  const [busy, setBusy] = useState(false);

  const current = psychosomaticQuestions[step];
  const selected = answers[current?.key];
  const progressPct = useMemo(() => Math.round((step / psychosomaticQuestions.length) * 100), [step]);

  const selectAnswer = (value: AnswerValue) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
  };

  const saveDraft = async () => {
    if (!current) return;
    const answerKey = answers[current.key];
    if (!answerKey) return;

    await fetch("/api/diagnostics/psychosomatic/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        questionKey: current.key,
        answerKey,
        consentAcceptedAt: consent ? new Date().toISOString() : undefined,
      }),
    });
  };

  const onNext = async () => {
    if (!current || !answers[current.key]) return;

    setBusy(true);
    await saveDraft();
    setBusy(false);

    if (step + 1 < psychosomaticQuestions.length) {
      setStep((prev) => prev + 1);
      return;
    }

    const payloadAnswers = answers as PsychoAnswers;
    setBusy(true);
    const response = await fetch("/api/diagnostics/psychosomatic/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answers: payloadAnswers,
      }),
    });

    const data = await response.json();
    setBusy(false);

    if (response.ok && data.result) {
      setResult(data.result as PsychoScore);
    }
  };

  if (!started) {
    return (
      <section className="card">
        <label className="answer-option" data-selected={consent}>
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
      </section>
    );
  }

  if (result) {
    return (
      <section className="card" data-testid="result-card">
        <h2>{labels.resultTitle}</h2>
        <p data-testid="result-overall-pct">
          {labels.overallLabel}: <strong>{result.overallPct}%</strong>
        </p>
        <p data-testid="result-level">
          {labels.levelLabel}: <strong>{levelLabels[locale][result.level]}</strong>
        </p>

        <div className="grid cols-2">
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

        <div className="card" style={{ padding: 14 }} data-testid="result-recommendations">
          <h3>{labels.recommendationsLabel}</h3>
          {result.recommendations.map((block, idx) => (
            <div key={idx}>
              <strong>{block.title}</strong>
              <ul>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="inline-row" style={{ marginTop: 12 }}>
          <a href={productsHref} className="button button-primary" data-testid="cta-go-products">
            {labels.toProducts}
          </a>
          <a href={knowledgeHref} className="button button-muted">
            {labels.toKnowledge}
          </a>
        </div>
      </section>
    );
  }

  const options = current ? getQuestionOptions(current, locale) : null;

  return (
    <section className="card">
      <p className="muted">Progress: {progressPct}%</p>
      <h2>{current?.title[locale]}</h2>
      <p className="muted">{current?.hint[locale]}</p>

      <div className="answer-grid">
        {orderedAnswers.map((value, index) => (
          <button
            key={value}
            type="button"
            className="answer-option"
            data-selected={selected === value}
            onClick={() => selectAnswer(value)}
            data-testid={`answer-option-${step}-${index}`}
          >
            <span>{options?.[value]}</span>
          </button>
        ))}
      </div>

      <div className="inline-row" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="button button-primary"
          onClick={onNext}
          disabled={!selected || busy}
          data-testid="question-next-button"
        >
          {step + 1 < psychosomaticQuestions.length ? labels.next : labels.finish}
        </button>
      </div>

      <section style={{ marginTop: 16 }}>
        <h3>{labels.historyTitle}</h3>
        <div className="list">
          {initialHistory.slice(0, 5).map((item) => (
            <div key={item.id} className="answer-option">
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <strong>{item.overallPct}%</strong>
              <span className="muted">{item.level}</span>
            </div>
          ))}
          {initialHistory.length === 0 ? <p className="muted">No history yet.</p> : null}
        </div>
      </section>
    </section>
  );
};
