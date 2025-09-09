"use client";
import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, ...props }, ref) => <button ref={ref} {...props} />
);
Button.displayName = "Button";
