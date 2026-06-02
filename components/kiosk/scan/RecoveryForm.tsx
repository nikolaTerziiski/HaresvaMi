"use client";

import { useEffect, useState } from "react";

import type { KioskScanCopy } from "@/lib/kiosk/types";

const AUTO_ADVANCE_MS = 45_000;

type RecoveryFormProps = {
  copy: KioskScanCopy;
  restaurantId: string;
  sessionId: string | null;
  onDone: () => void;
  submitRecoveryComment: (input: {
    restaurantId: string;
    sessionId: string;
    comment: string;
  }) => Promise<{ ok: boolean }>;
};

export function RecoveryForm({
  copy,
  restaurantId,
  sessionId,
  onDone,
  submitRecoveryComment,
}: RecoveryFormProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-advance only while the textarea is empty — cancel once the user starts typing
  useEffect(() => {
    if (comment.trim() !== "") {
      return;
    }

    const timer = window.setTimeout(onDone, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [comment, onDone]);

  async function handleSubmit() {
    if (!comment.trim() || !sessionId) {
      onDone();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitRecoveryComment({
        restaurantId,
        sessionId,
        comment: comment.trim(),
      });

      if (!result.ok) {
        setError(copy.feedbackFailed ?? "Грешка при изпращане.");
        setIsSubmitting(false);
        return;
      }

      onDone();
    } catch {
      setError(copy.feedbackFailed ?? "Грешка при изпращане.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100dvh-56px)] place-items-center px-6">
      <section className="w-full max-w-[640px]">
        <h2 className="m-0 font-[var(--f-display)] text-[48px] font-normal leading-none text-[var(--ink)] max-md:text-[36px]">
          {copy.reputationUnhappyTitle}
        </h2>
        <p className="mt-4 mb-6 text-[18px] leading-[1.55] text-[var(--ink-2)]">
          {copy.reputationUnhappyBody}
        </p>

        <textarea
          className="w-full resize-none rounded-2xl border border-[var(--rule)] bg-[var(--paper)] px-5 py-4 text-[17px] leading-[1.5] text-[var(--ink)] placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)] focus:outline-none"
          rows={5}
          placeholder={copy.recoveryPlaceholder}
          value={comment}
          disabled={isSubmitting}
          onChange={(e) => setComment(e.target.value)}
        />

        {error ? (
          <p className="mt-2 text-[14px] text-[var(--accent)]">{error}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-14 min-w-[200px] items-center justify-center rounded-[20px] bg-[var(--accent)] px-7 py-3.5 text-[18px] font-semibold text-[var(--paper)] disabled:cursor-not-allowed disabled:bg-[var(--rule)] disabled:text-[var(--ink-mute)]"
            disabled={isSubmitting || !comment.trim()}
            onClick={handleSubmit}
          >
            {isSubmitting ? copy.recoverySubmitting : copy.recoverySubmit}
          </button>

          <button
            type="button"
            className="inline-flex min-h-14 items-center justify-center rounded-[20px] border border-[var(--rule)] bg-[var(--paper)] px-6 py-3.5 text-[17px] text-[var(--ink-2)] transition hover:border-[var(--ink)]"
            disabled={isSubmitting}
            onClick={onDone}
          >
            {copy.recoverySkip}
          </button>
        </div>
      </section>
    </div>
  );
}
