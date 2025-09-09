import * as React from "react";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number[];
  onValueChange?: (value: number[]) => void;
}

export function Slider({ value, onValueChange, ...props }: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    onValueChange?.([v]);
  };
  return <input type="range" value={value[0]} onChange={handleChange} {...props} />;
}
