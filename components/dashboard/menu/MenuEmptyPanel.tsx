import { MenuEmptyState } from "@/components/dashboard/menu/MenuEmptyState";

type MenuEmptyPanelProps = {
  error: string | null;
  onFileSelect: (file: File) => void | Promise<void>;
  onManualEntry: () => void;
};

export function MenuEmptyPanel({
  error,
  onFileSelect,
  onManualEntry,
}: MenuEmptyPanelProps) {
  return (
    <div className="w-full">
      {error ? (
        <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-[color-mix(in_oklab,var(--bad)_20%,transparent)] bg-[color-mix(in_oklab,var(--bad)_7%,var(--paper))] px-4 py-3 text-sm text-[var(--bad)]">
          {error}
        </div>
      ) : null}
      <MenuEmptyState
        onFileSelect={onFileSelect}
        onManualEntry={onManualEntry}
      />
    </div>
  );
}
