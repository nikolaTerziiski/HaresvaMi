"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

function Menu(props: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root {...props} />;
}

function MenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />;
}

function MenuContent({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 6,
  children,
  ...props
}: MenuPrimitive.Popup.Props & {
  side?: MenuPrimitive.Positioner.Props["side"];
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"];
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="menu-content"
          className={cn(
            "max-h-[360px] min-w-[160px] overflow-y-auto rounded-lg border border-[var(--rule)] bg-[var(--paper)] py-1 shadow-[0_8px_24px_-4px_rgba(26,21,18,0.15)] outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function MenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-[var(--f-ui)] text-[13px] text-[var(--ink)] outline-none transition-colors select-none hover:bg-[var(--bg)] data-[highlighted]:bg-[var(--bg)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

// Plain element on purpose: Base UI's Menu.GroupLabel requires a Menu.Group
// ancestor (MenuGroupRootContext) and throws "MenuGroupRootContext is missing"
// without one. These labels are used bare inside MenuContent as a visual section
// header, so render a styled div rather than the context-bound primitive.
function MenuGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="menu-group-label"
      className={cn(
        "px-3 py-1.5 font-[var(--f-ui)] text-[11px] tracking-[0.12em] text-[var(--ink-mute)] uppercase",
        className,
      )}
      {...props}
    />
  );
}

function MenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn("my-1 h-px bg-[var(--rule)]", className)}
      {...props}
    />
  );
}

function MenuCheckboxItem({
  className,
  children,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menu-checkbox-item"
      className={cn(
        "group/cbx flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 font-[var(--f-ui)] text-[13px] text-[var(--ink)] outline-none transition-colors select-none hover:bg-[var(--bg)] data-[highlighted]:bg-[var(--bg)]",
        className,
      )}
      {...props}
    >
      <span className="grid size-4 shrink-0 place-items-center rounded-[4px] border border-[var(--rule)] bg-[var(--paper)] group-data-[checked]/cbx:border-[var(--ink)] group-data-[checked]/cbx:bg-[var(--ink)]">
        <MenuPrimitive.CheckboxItemIndicator>
          <Check className="size-3 text-[var(--paper)]" strokeWidth={3} />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

export {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuGroupLabel,
  MenuSeparator,
  MenuCheckboxItem,
};
