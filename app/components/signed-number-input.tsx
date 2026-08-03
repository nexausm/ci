"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function SignedNumberInput({
  value,
  onValueChange,
  ...rest
}: Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: number;
  onValueChange: (value: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(String(value));
  }, [focused, value]);

  return (
    <Input
      {...rest}
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const n = text === "" ? 0 : Number(text);
        if (!Number.isNaN(n)) onValueChange(n);
      }}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        if (v !== "" && !Number.isNaN(Number(v))) onValueChange(Number(v));
      }}
    />
  );
}
