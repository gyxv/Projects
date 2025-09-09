"use client";
import * as React from "react";

export function TooltipProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

export function Tooltip({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

export function TooltipTrigger({ asChild, ...props }: TooltipTriggerProps) {
  return <span {...props} />;
}

export function TooltipContent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}
