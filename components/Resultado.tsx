"use client";
import { useMemo } from "react";
import type { CalcResult } from "@/lib/calc";
import { formatBRL } from "@/lib/format";
import {
  buildImageURL,
  buildWhatsAppMessage,
  buildWhatsAppURL,
  type LeadData,
} from "@/lib/whatsapp";

interface Props {
  lead: LeadData;
  result: CalcResult;
  onRestart: () => void;
}

export default function Resultado({ lead, result, onRestart }: Props) {
  const { imageURL, whatsappURL } = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const img = buildImageURL(origin, lead, result);
    const msg = buildWhatsAppMessage(lead, result, img);
    return { imageURL: img, whatsappURL: buildWhatsAppURL(msg) };
  }, [lead, result]);

  const handleWhatsApp = () => {
    window.open(whatsappURL, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(imageURL);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagnostico-tributario-${lead.nome
        .trim()
        .toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(imageURL, "_blank");
    }
  };

  return (
    <div>
      <div className="mb-3">
        <button
          type="button"
          onClick={onRestart}
          className="text-sm text-white/55 hover:text-white transition-colors"
        >
          ← Refazer cálculo
        </button>
      </div>

      <div className="text-center text-[13px] font-bold tracking-[0.14em] text-gold-500 mb-3">
        DIAGNÓSTICO COMPLETO
      </div>
      <div className="h-[2px] w-full bg-gold-500 rounded-full mb-13" />

      <h2 className="text-[30px] font-bold leading-snug -tracking-[0.01em] mb-8 mt-13">
        {result.titulo}
      </h2>

      <div className="rounded-2xl border-[1.5px] border-white/12 bg-white/[0.06] p-7 text-center mb-4">
        <p className="text-xs uppercase tracking-wider text-white/55 mb-2.5">
          Você pode parar de pagar até
        </p>
        <p className="text-[54px] font-black text-gold-500 leading-none -tracking-[0.02em]">
          {formatBRL(result.economiaAnual)}
        </p>
        <p className="text-sm text-white/55 mt-2.5">
          por ano — redução estimada de {result.reducaoPct}% da carga tributária
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl border-[1.5px] border-white/12 bg-white/[0.06] p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">
            Imposto atual / ano
          </p>
          <p className="text-[22px] font-extrabold text-white">
            {formatBRL(result.impostoAtualAnual)}
          </p>
          <p className="text-[11px] text-white/30 mt-1">
            {result.cargaAtualPct} do faturamento
          </p>
        </div>
        <div className="rounded-xl border-[1.5px] border-gold-500/45 bg-gold-500/7 p-4 text-center">
          <p className="text-[11px] uppercase tracking-wider text-white/30 mb-2">
            Imposto otimizado / ano
          </p>
          <p className="text-[22px] font-extrabold text-gold-500">
            {formatBRL(result.impostoOtimizadoAnual)}
          </p>
          <p className="text-[11px] text-white/30 mt-1">
            {result.cargaOtimizadaPct} do faturamento
          </p>
        </div>
      </div>

      {result.diag && (
        <div
          className="rounded-r-xl border-l-[3px] border-gold-500 bg-cyan-900/30 px-4 py-3.5 text-sm text-white/55 leading-relaxed mb-7"
          dangerouslySetInnerHTML={{ __html: result.diag }}
        />
      )}

      <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mb-4">
        Oportunidades identificadas para você
      </p>
      <div className="mb-8">
        {result.oportunidades.slice(0, 4).map((o, i) => (
          <div
            key={i}
            className="flex gap-3.5 py-3.5 border-b border-white/5 last:border-b-0"
          >
            <span className="text-[22px] flex-shrink-0 mt-0.5">{o.icon}</span>
            <div>
              <strong className="block text-sm font-bold text-white mb-1">
                {o.title}
              </strong>
              <span className="text-[13px] text-white/55 leading-relaxed">
                {o.desc}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.04] mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageURL}
          alt={`Diagnóstico tributário para ${lead.nome}`}
          className="w-full h-auto block"
          loading="eager"
        />
      </div>

      <p className="text-center text-xs text-white/30 leading-relaxed mb-5">
        Cálculo estimativo baseado na Lei 9.249/95 e legislação tributária
        vigente.
        <br />
        Resultado final depende de análise tributária individual.
      </p>

      <button onClick={handleWhatsApp} className="cta-primary w-full mb-3">
        Quero reduzir meus impostos →
      </button>
      <button
        onClick={handleDownload}
        className="w-full text-center text-sm text-white/55 hover:text-white transition-colors py-2 underline"
      >
        Baixar diagnóstico em imagem
      </button>
    </div>
  );
}
