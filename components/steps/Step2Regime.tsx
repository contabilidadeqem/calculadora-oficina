"use client";
import type { Regime } from "@/lib/calc";

const OPTS: { value: Regime; icon: string; title: string; sub: string }[] = [
  { value: "simples", icon: "🟢", title: "Simples Nacional", sub: "Recolhe tudo pelo DAS mensal" },
  { value: "presumido", icon: "🟡", title: "Lucro Presumido", sub: "Paga IRPJ, CSLL, PIS, COFINS separados" },
  { value: "real", icon: "🔵", title: "Lucro Real", sub: "Apura o lucro efetivo a cada período" },
  { value: "nao-sei", icon: "❓", title: "Não sei", sub: "Me ajude a identificar" },
];

export default function Step2Regime({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: Regime | null;
  onChange: (v: Regime) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="heading-display mb-3">
        Qual é o regime tributário da sua empresa hoje?
      </h2>
      <p className="text-[15px] text-white/55 leading-relaxed mb-10">
        Se não souber, consulte seu contador ou verifique se paga pelo DAS todo
        mês.
      </p>

      <div className="grid sm:grid-cols-2 gap-3.5 mb-10">
        {OPTS.map((o) => (
          <button
            key={o.value}
            type="button"
            className="option-card"
            data-selected={value === o.value}
            onClick={() => onChange(o.value)}
          >
            <div className="h-9 w-9 rounded-md bg-white/10 flex items-center justify-center text-xl mb-1.5">
              {o.icon}
            </div>
            <div className="opt-title text-[15px] font-bold mb-1">{o.title}</div>
            <div className="text-[13px] text-white/55 leading-snug">{o.sub}</div>
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-2">
        <button onClick={onNext} disabled={!value} className="cta-primary w-full">
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
