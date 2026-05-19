"use client";

import type { MenuImportResult } from "@/lib/menu/import-types";

type ImportReviewStepPlaceholderProps = {
  result: MenuImportResult;
  onDiscard: () => void;
};

/**
 * Temporary Phase 2 stub. Phase 3 deletes this file and replaces it with
 * the real ImportReviewStep component.
 */
export function ImportReviewStepPlaceholder({
  result,
  onDiscard,
}: ImportReviewStepPlaceholderProps) {
  return (
    <div className="mt-8 rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-8">
      <p className="mb-2 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
        Phase 2 placeholder · Review step
      </p>
      <h2 className="mb-4 font-[var(--f-display)] text-[26px] font-normal text-[var(--ink)]">
        Анализът е готов —{" "}
        <em className="italic text-[var(--accent)]">
          {result.stats.items_extracted} ястия
        </em>
      </h2>
      <pre className="max-h-[60vh] overflow-auto rounded-lg border border-[var(--rule)] bg-[var(--bg)] p-4 font-[var(--f-mono)] text-[12px] leading-[1.6] text-[var(--ink-2)]">
        {JSON.stringify(result, null, 2)}
      </pre>
      <button
        type="button"
        onClick={onDiscard}
        className="mt-6 rounded-lg border border-[var(--rule)] px-5 py-2.5 font-[var(--f-mono)] text-[12px] uppercase tracking-[0.06em] text-[var(--ink-mute)] transition-colors hover:border-[var(--ink-mute)] hover:text-[var(--ink)]"
      >
        Започни отначало
      </button>
    </div>
  );
}
