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

type KioskExitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function KioskExitDialog({
  open,
  onOpenChange,
  onConfirm,
}: KioskExitDialogProps) {
  const t = useTranslations("kiosk.exit");
  const commonActions = useTranslations("common.actions");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("confirmTitle")}</DialogTitle>
          <DialogDescription>{t("confirmDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {commonActions("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-[var(--accent)] text-[var(--paper)] hover:bg-[var(--plum)]"
          >
            {t("confirmCta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
