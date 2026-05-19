"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { FileTile } from "@/components/dashboard/menu/import/FileTile";
import {
  CamIcon,
  CheckIcon,
  SmallUploadIcon,
  SparklesIcon,
  UploadIcon,
} from "@/components/dashboard/menu/import/ImportIcons";

type ImportUploadStepProps = {
  files: File[];
  error: string | null;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onStart: () => void;
};

function totalSizeMb(files: File[]) {
  const total = files.reduce((s, f) => s + f.size, 0);
  return (total / (1024 * 1024)).toFixed(1);
}

const TIPS = [
  "upload.tips.tip1",
  "upload.tips.tip2",
  "upload.tips.tip3",
] as const;

export function ImportUploadStep({
  files,
  error,
  onAddFiles,
  onRemoveFile,
  onStart,
}: ImportUploadStepProps) {
  const t = useTranslations("dashboard.menu.import");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) onAddFiles(dropped);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length > 0) onAddFiles(picked);
    // Reset so the same file can be re-selected after removal
    e.target.value = "";
  }

  const canStart = files.length > 0;

  const dropzoneBorderColor = isDragging
    ? "var(--accent)"
    : "color-mix(in oklab, var(--accent) 30%, var(--rule))";
  const dropzoneBg = isDragging
    ? "color-mix(in oklab, var(--accent) 6%, var(--paper))"
    : "var(--paper)";

  return (
    <div className="w-full">
      {/* Intro */}
      <div>
        <p className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {t("upload.eyebrow")}
        </p>
        <h2 className="mt-2 mb-3.5 font-[var(--f-display)] text-[42px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[32px]">
          Качи <em className="italic text-[var(--accent)]">менюто</em> — AI
          чете, ти само преглеждаш.
        </h2>
        <p className="m-0 max-w-[620px] text-[15.5px] leading-[1.55] text-[var(--ink-mute)]">
          {t("upload.subtitle")}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="mt-4 rounded-lg border border-[var(--accent)] px-4 py-3 text-[13.5px] text-[var(--accent)]"
          style={{
            background: "color-mix(in oklab, var(--accent) 8%, var(--paper))",
          }}
        >
          {error}
        </div>
      )}

      {/* Two-column grid — stacks on narrow viewports */}
      <div
        className="mt-9 grid items-start gap-7 max-[960px]:grid-cols-1"
        style={{ gridTemplateColumns: "1.4fr 1fr" }}
      >
        {/* Left: Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="relative flex min-h-[360px] flex-col rounded-2xl p-10 transition-colors max-md:p-6"
          style={{
            background: dropzoneBg,
            border: `2px dashed ${dropzoneBorderColor}`,
          }}
        >
          {/* Top section */}
          <div className="mb-5 flex items-start gap-[18px]">
            <div
              className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-[14px] text-[var(--paper)]"
              style={{
                background: "linear-gradient(140deg, var(--accent), #D17A2A)",
                boxShadow: "0 12px 28px -10px rgba(194,77,44,0.5)",
              }}
            >
              <UploadIcon />
            </div>
            <div>
              <h3 className="mb-1 font-[var(--f-display)] text-[30px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)]">
                Пусни тук{" "}
                <em className="italic text-[var(--accent)]">файловете</em>
              </h3>
              <p className="m-0 max-w-[460px] text-[14px] text-[var(--ink-mute)]">
                {t("upload.dropzone.subtitle")}
              </p>
            </div>
          </div>

          {/* File tiles */}
          {files.length > 0 && (
            <div
              className="mt-6 grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              }}
            >
              {files.map((file, i) => (
                <FileTile
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  file={file}
                  index={i}
                  onRemove={onRemoveFile}
                />
              ))}
            </div>
          )}

          {/* CTA: picker + camera buttons */}
          <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-dashed border-[var(--rule)] pt-6">
            <span className="font-[var(--f-mono)] text-[10.5px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
              Или:
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-[9px] bg-[var(--ink)] px-[18px] py-[11px] text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--accent)]"
            >
              <SmallUploadIcon /> {t("upload.dropzone.picker")}
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-[9px] border border-[var(--rule)] px-4 py-[10px] text-[14px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
            >
              <CamIcon /> {t("upload.dropzone.camera")}
            </button>
            <span className="ml-auto font-[var(--f-mono)] text-[10.5px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
              {t("upload.dropzone.formats")}
            </span>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleFileInputChange}
            aria-hidden="true"
          />
          <input
            ref={cameraInputRef}
            type="file"
            capture="environment"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
            aria-hidden="true"
          />

          {/* Action row */}
          <div className="mt-6 flex items-center gap-3.5 border-t border-[var(--rule)] pt-5">
            <div className="flex-1 text-[13px] text-[var(--ink-2)]">
              {files.length > 0 ? (
                <>
                  <b className="font-medium text-[var(--ink)]">
                    {files.length} {files.length === 1 ? "файл" : "файла"}
                  </b>{" "}
                  <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                    · общо {totalSizeMb(files)} MB
                  </span>
                </>
              ) : (
                <span className="text-[var(--ink-mute)]">
                  Няма избрани файлове
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onStart}
              disabled={!canStart}
              className="inline-flex items-center gap-2.5 rounded-[10px] px-[22px] py-[13px] text-[14.5px] font-medium text-[var(--paper)] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={
                canStart
                  ? {
                      background: "var(--accent)",
                      boxShadow: "0 10px 24px -10px rgba(194,77,44,0.55)",
                    }
                  : { background: "var(--accent)" }
              }
            >
              <SparklesIcon />
              {t("upload.actions.start")}
            </button>
          </div>
        </div>

        {/* Right: Aside */}
        <aside className="sticky top-[130px] flex flex-col gap-4 max-[960px]:static">
          {/* Tip card */}
          <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-6 py-[22px]">
            <p className="mb-2.5 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
              {t("upload.tips.label")}
            </p>
            <h4 className="mb-1.5 font-[var(--f-display)] text-[22px] font-normal tracking-[-0.01em] text-[var(--ink)]">
              За <em className="italic text-[var(--accent)]">най-добри</em>{" "}
              резултати
            </h4>
            <p className="m-0 text-[13px] leading-[1.55] text-[var(--ink-2)]">
              {t("upload.tips.subtitle")}
            </p>
            <ul className="m-0 mt-3.5 list-none p-0">
              {TIPS.map((tipKey, i) => (
                <li
                  key={tipKey}
                  className="flex gap-3 border-t border-[var(--rule-soft)] py-2.5 text-[13px] leading-[1.5] text-[var(--ink-2)] first:border-t-0 first:pt-0"
                >
                  <span
                    className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-[6px] text-[var(--accent)]"
                    style={{
                      background:
                        "color-mix(in oklab, var(--accent) 8%, var(--bg))",
                    }}
                  >
                    <CheckIcon />
                  </span>
                  <span>{t(tipKey)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Manual fallback card */}
          <div className="flex items-center gap-3.5 rounded-xl border border-dashed border-[var(--rule)] px-5 py-4">
            <div className="flex-1 text-[13px] text-[var(--ink-2)]">
              <b className="block font-medium text-[var(--ink)]">
                {t("upload.manualFallback.title")}
              </b>
              {t("upload.manualFallback.body")}
            </div>
            <Link
              href="/dashboard/menu?manual=1"
              className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)] no-underline transition-colors hover:text-[var(--accent)]"
            >
              {t("upload.manualFallback.cta")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
