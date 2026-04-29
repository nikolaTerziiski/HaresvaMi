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

type MenuStartOverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function MenuStartOverDialog({
  open,
  onOpenChange,
  onConfirm,
}: MenuStartOverDialogProps) {
  const t = useTranslations("dashboard.menu");
  const commonActions = useTranslations("common.actions");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("startOverConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("startOverConfirmDesc")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {commonActions("cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-[var(--accent)] text-[var(--paper)] hover:bg-[var(--plum)]"
          >
            {t("startOverConfirmCta")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
