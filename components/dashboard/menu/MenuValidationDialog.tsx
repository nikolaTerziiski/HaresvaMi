"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type MenuValidationDialogProps = {
  open: boolean;
  messages: string[];
  onOpenChange: (open: boolean) => void;
};

export function MenuValidationDialog({
  open,
  messages,
  onOpenChange,
}: MenuValidationDialogProps) {
  const t = useTranslations("dashboard.menu.validationDialog");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[var(--rule)] bg-[var(--paper)] text-[var(--ink)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[var(--f-ui)] text-xl leading-[1.2] text-[var(--ink)]">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-[1.5] text-[var(--ink-2)]">
            {t("body")}
          </DialogDescription>
        </DialogHeader>

        <ul className="grid max-h-[320px] gap-3 overflow-y-auto rounded-lg border border-[color-mix(in_oklab,var(--bad)_18%,var(--rule))] bg-[color-mix(in_oklab,var(--bad)_6%,var(--paper))] p-4">
          {messages.map((message) => (
            <li
              key={message}
              className="flex gap-2 text-[14px] leading-[1.5] text-[var(--ink)]"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bad)]" />
              <span>{message}</span>
            </li>
          ))}
        </ul>

        <DialogFooter className="border-[var(--rule)] bg-[var(--bg)]">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--plum)]"
          >
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
