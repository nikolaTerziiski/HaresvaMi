import { MenuEmptyDesign } from "@/components/dashboard/menu/design-preview/MenuEmptyDesign";
import { MenuReviewDesign } from "@/components/dashboard/menu/design-preview/MenuReviewDesign";
import { MenuReviewReturnDesign } from "@/components/dashboard/menu/design-preview/MenuReviewReturnDesign";

export const metadata = {
  title: "Menu design preview | HaresvaMi",
};

export default function MenuDesignPreviewPage() {
  return (
    <div className="w-full">
      <PreviewLabel
        index="01"
        title="Empty state"
        subtitle="Owner lands here from onboarding, zero items"
      />
      <MenuEmptyDesign />

      <PreviewLabel
        index="02"
        title="Review state — first time"
        subtitle="AI extracted ~12 items, owner verifies before saving"
      />
      <MenuReviewDesign />

      <PreviewLabel
        index="03"
        title="Return state"
        subtitle="Owner returns to an established saved menu"
      />
      <MenuReviewReturnDesign />
    </div>
  );
}

function PreviewLabel({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-y border-dashed border-[var(--accent)] bg-[var(--bg-2)] px-10 py-3 max-md:px-6">
      <p className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
        Preview · {index}
      </p>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="font-[var(--f-display)] text-[18px] text-[var(--ink)]">
          {title}
        </span>
        <span className="text-[12px] text-[var(--ink-mute)]">— {subtitle}</span>
      </div>
    </div>
  );
}
