import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium font-data",
  {
    variants: {
      variant: {
        default: "border-border bg-panel-hover text-foreground",
        up: "border-signal-up/25 bg-signal-up/10 text-signal-up",
        down: "border-signal-down/25 bg-signal-down/10 text-signal-down",
        warn: "border-signal-warn/25 bg-signal-warn/10 text-signal-warn",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-muted-foreground border-border",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
