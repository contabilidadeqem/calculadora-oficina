"use client";
import type {
  SimNaoNaoSei,
  FrequenciaNF,
  TempoEmpresa,
} from "@/lib/calc";

interface Props {
  proLabore: SimNaoNaoSei | null;
  emiteNF: FrequenciaNF | null;
  tempo: TempoEmpresa | null;
  onProLabore: (v: SimNaoNaoSei) => void;
  onEmiteNF: (v: FrequenciaNF) => void;
  onTempo: (v: TempoEmpresa) => void;
  onNext: () => void;
  onBack: () => void;
}

const PILLS_PL: { value: SimNaoNaoSei; label: string }[] = [
  { value: "sim", label: "✅ Sim" },
  { value: "nao", label: "❌ Não" },
  { value: "nao-sei", label: "Não sei" },
];
const PILLS_NF: { value: FrequenciaNF; label: string }[] = [
  { value: "sempre", label: "Sempre" },
  { value: "maioria", label: "Na maioria" },
  { value: "raramente", label: "Raramente" },
];
const PILLS_TEMPO: { value: TempoEmpresa; label: string }[] = [
  { value: "menos1", label: "Menos de 1 ano" },
  { value: "1a2", label: "1 a 2 anos" },
  { value: "mais2", label: "Mais de 2 anos" },
];

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5 mb-7">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className="pill"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Step7Detalhes({
  proLabore,
  emiteNF,
  tempo,
  onProLabore,
  onEmiteNF,
  onTempo,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="flex-1 flex flex-col">
      <h2 className="heading-display mb-3">
        Três perguntas rápidas para fechar o diagnóstico.
      </h2>
      <p className="text-[15px] text-white/55 leading-relaxed mb-10">
        Não precisa ser exato — nos ajude a refinar o resultado.
      </p>

      <div>
        <label className="field-label">Você tem pró-labore declarado?</label>
        <PillGroup options={PILLS_PL} value={proLabore} onChange={onProLabore} />
      </div>
      <div>
        <label className="field-label">
          Emite nota fiscal em todos os serviços?
        </label>
        <PillGroup options={PILLS_NF} value={emiteNF} onChange={onEmiteNF} />
      </div>
      <div>
        <label className="field-label">
          Há quanto tempo sua empresa está aberta?
        </label>
        <PillGroup options={PILLS_TEMPO} value={tempo} onChange={onTempo} />
      </div>

      <div className="mt-auto pt-4 space-y-2">
        <button onClick={onNext} className="cta-primary w-full">
          Ver meu diagnóstico →
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
