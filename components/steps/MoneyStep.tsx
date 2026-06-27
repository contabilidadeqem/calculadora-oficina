"use client";
import { useState, useEffect } from "react";
import { formatMaskedInt, parseDigits } from "@/lib/format";

interface Props {
  question: string;
  hint: string;
  inputId: string;
  placeholder: string;
  inputNote: string;
  value: number;
  minimum?: number;
  onChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function MoneyStep({
  question,
  hint,
  inputId,
  placeholder,
  inputNote,
  value,
  minimum = 1,
  onChange,
  onNext,
  onBack,
}: Props) {
  const initial = value > 0 ? String(value) : "";
  const [digits, setDigits] = useState(initial);

  useEffect(() => {
    onChange(parseDigits(digits));
  }, [digits, onChange]);

  const valid = parseDigits(digits) >= minimum;

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="heading-display mb-3">{question}</h2>
      <p className="text-[15px] text-white/55 leading-relaxed mb-10">{hint}</p>

      <div className="relative mb-2.5">
        <span className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[22px] font-bold text-gold-500 pointer-events-none">
          R$
        </span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          className="money-input"
          value={formatMaskedInt(digits)}
          onChange={(e) =>
            setDigits(e.target.value.replace(/\D/g, "").slice(0, 12))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && valid) onNext();
          }}
        />
      </div>
      <p className="text-[13px] text-white/30 text-center mb-10">{inputNote}</p>

      <div className="mt-auto space-y-2">
        <button onClick={onNext} disabled={!valid} className="cta-primary w-full">
          Continuar →
        </button>
        <button
          onClick={onBack}
          className="w-full text-center text-sm text-white/30 hover:text-white/55 transition-colors py-2"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
