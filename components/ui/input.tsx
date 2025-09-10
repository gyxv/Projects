"use client";
import * as React from "react";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`rounded-full border border-white/20 bg-white/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
