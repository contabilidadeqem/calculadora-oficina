"use client";
import type { TipoNegocio } from "@/lib/calc";

const OPTS: { value: TipoNegocio; icon: string; title: string; sub: string }[] = [
  { value: "oficina", icon: "🔧", title: "Oficina Mecânica", sub: "Serviços automotivos em geral" },
  { value: "autopecas", icon: "🏪", title: "Autopeças", sub: "Venda de peças e acessórios" },
  { value: "ambos", icon: "🏢", title: "Ambos", sub: "Oficina com loja de peças" },
];

export default function Step1Tipo({
  value,
  onChange,
  onNext,
}: {
  value: TipoNegocio | null;
  onChange: (v: TipoNegocio) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <h1 className="heading-display mb-3">
        Oficina, autopeças ou os dois? Descubra quanto sua empresa pode parar de
        pagar de imposto.
      </h1>
      <p className="text-[15px] text-white/55 leading-relaxed mb-10">
        Selecione o tipo de atividade do seu negócio para iniciarmos o
        diagnóstico.
      </p>

      <div className="grid sm:grid-cols-3 gap-3.5 mb-10">
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

      <div className="mt-auto">
        <button onClick={onNext} disabled={!value} className="cta-primary w-full">
          Calcular minha economia →
        </button>
      </div>
    </div>
  );
}
