"use client";
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`rounded-full border border-white/20 px-4 py-2 transition-colors ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
