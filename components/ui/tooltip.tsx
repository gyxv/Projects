"use client";
import * as React from "react";

const TooltipContext = React.createContext<{open:boolean}>({open:false});

export function TooltipProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

export function Tooltip({ children }: React.PropsWithChildren) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEnter = () => {
    timer.current = setTimeout(() => setOpen(true), 1000);
  };
  const onLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(false);
  };
  return (
    <div onMouseEnter={onEnter} onMouseLeave={onLeave} className="relative inline-block">
      <TooltipContext.Provider value={{ open }}>{children}</TooltipContext.Provider>
    </div>
  );
}

export interface TooltipTriggerProps extends React.HTMLAttributes<HTMLSpanElement> {
  asChild?: boolean;
}

export function TooltipTrigger({ asChild, ...props }: TooltipTriggerProps) {
  if (asChild && React.isValidElement(props.children)) {
    return React.cloneElement(props.children as React.ReactElement);
  }
  return <span {...props} />;
}

export function TooltipContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = React.useContext(TooltipContext);
  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-white text-xs opacity-0 transition-opacity duration-300 ${open ? "opacity-100" : ""} ${className}`}
      {...props}
    />
  );
}
