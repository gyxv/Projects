"use client";
import * as React from "react";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number[];
  onValueChange?: (value: number[]) => void;
  className?: string;
}

export function Slider({ value, onValueChange, className = "", ...props }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onValueChange?.([v]);
  };
  return (
    <input
      type="range"
      value={value[0]}
      onChange={handleChange}
      className={`w-full h-2 rounded-full cursor-pointer appearance-none bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-fuchsia-500/50 ${className}`}
      style={{ accentColor: "#22d3ee" }}
      {...props}
    />
  );
}
