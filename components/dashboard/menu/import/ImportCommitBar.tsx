"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

type ImportCommitBarProps = {
  itemCount: number;
  warnCount: number;
  saving: boolean;
  onDiscard: () => void;
  onCommit: () => void;
};

export function ImportCommitBar({
  itemCount,
  warnCount,
  saving,
  onDiscard,
  onCommit,
}: ImportCommitBarProps) {
  const t = useTranslations("dashboard.menu.import.review.commit");

  return (
    <div
      className="sticky bottom-5 mt-7 flex items-center gap-4 rounded-2xl px-5 py-4"
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        boxShadow: "0 20px 50px -20px rgba(0,0,0,0.4)",
        zIndex: 30,
      }}
    >
      {/* Info text */}
      <div className="flex-1 font-[var(--f-ui)] text-[13px]">
        <b className="block text-[14.5px]">
          {t("ready", { count: itemCount })}
        </b>
        {warnCount > 0 ? (
          <span
            className="font-[var(--f-mono)] text-[11px] tracking-[0.04em]"
            style={{ color: "rgba(253,249,241,0.65)" }}
          >
            {t("warning", { count: warnCount })}
          </span>
        ) : null}
      </div>

      {/* Discard ghost */}
      <button
        type="button"
        disabled={saving}
        onClick={onDiscard}
        className="rounded-md px-3 py-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em] transition-colors disabled:opacity-50"
        style={{ color: "rgba(253,249,241,0.65)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = "var(--paper)";
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color =
            "rgba(253,249,241,0.65)";
          (e.currentTarget as HTMLButtonElement).style.background = "";
        }}
      >
        {t("discard")}
      </button>

      {/* Commit CTA */}
      <button
        type="button"
        disabled={saving}
        onClick={onCommit}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] transition-colors disabled:opacity-60"
        style={{
          background: "var(--accent)",
          boxShadow: "0 6px 20px -8px rgba(194,77,44,0.6)",
        }}
        onMouseEnter={(e) => {
          if (!saving)
            (e.currentTarget as HTMLButtonElement).style.background = "#DC5F3D";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--accent)";
        }}
      >
        {saving ? (
          t("saving")
        ) : (
          <>
            <Check size={14} strokeWidth={2} />
            {t("cta")} →
          </>
        )}
      </button>
    </div>
  );
}
