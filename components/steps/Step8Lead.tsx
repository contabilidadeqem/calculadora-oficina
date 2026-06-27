"use client";
import { useState } from "react";
import { formatPhoneBR } from "@/lib/format";
import { trackEvent, newEventId } from "@/lib/pixel";
import type { CalcResult, TipoNegocio, Regime } from "@/lib/calc";
import { tipoLabel, regimeLabel, type LeadData } from "@/lib/whatsapp";

interface Props {
  tipo: TipoNegocio;
  regime: Regime;
  result: CalcResult;
  faturamentoMensal: number;
  impostoMensal: number;
  onSubmitted: (lead: LeadData) => void;
  onBack: () => void;
}

export default function Step8Lead({
  tipo,
  regime,
  result,
  faturamentoMensal,
  impostoMensal,
  onSubmitted,
  onBack,
}: Props) {
  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const phoneDigits = whatsapp.replace(/\D/g, "");
  const valid =
    nome.trim().length > 0 &&
    sobrenome.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phoneDigits.length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);

    const lead: LeadData = {
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      email: email.trim(),
      whatsapp: formatPhoneBR(phoneDigits),
      tipo,
      regime,
    };

    const eventId = newEventId();

    trackEvent(
      "Lead",
      {
        content_name: "Calculadora Oficina Autopecas",
        content_category: tipoLabel(tipo),
        currency: "BRL",
        value: Math.round(result.economiaAnual),
        regime: regimeLabel(regime),
        faturamento_mensal: Math.round(faturamentoMensal),
        imposto_mensal: Math.round(impostoMensal),
        economia_anual: Math.round(result.economiaAnual),
      },
      eventId
    );

    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: `${lead.nome} ${lead.sobrenome}`.trim(),
          email: lead.email,
          whatsapp: lead.whatsapp,
          tipoInternal: tipoLabel(tipo),
          regimeInternal: regimeLabel(regime),
          faturamentoMensal,
          impostoMensal,
          economiaAnual: result.economiaAnual,
          impostoAtualAnual: result.impostoAtualAnual,
          impostoOtimizadoAnual: result.impostoOtimizadoAnual,
          reducaoPct: result.reducaoPct,
          pageUri:
            typeof window !== "undefined" ? window.location.href : undefined,
          eventId,
          fbp:
            typeof document !== "undefined"
              ? document.cookie
                  .split("; ")
                  .find((c) => c.startsWith("_fbp="))
                  ?.split("=")[1]
              : undefined,
          fbc:
            typeof document !== "undefined"
              ? document.cookie
                  .split("; ")
                  .find((c) => c.startsWith("_fbc="))
                  ?.split("=")[1]
              : undefined,
        }),
        keepalive: true,
      });
    } catch (err) {
      console.warn("Falha ao registrar lead no CRM:", err);
    }

    onSubmitted(lead);
    setSubmitting(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="heading-display mb-3">
        Seu diagnóstico está pronto! Onde enviamos o resultado?
      </h2>
      <p className="text-[15px] text-white/55 leading-relaxed mb-10">
        Preencha seus dados para liberar o diagnóstico completo. É 100% gratuito
        e sem compromisso.
      </p>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="grid sm:grid-cols-2 gap-3.5 mb-3.5">
          <div>
            <label className="field-label" htmlFor="nome">
              Nome
            </label>
            <input
              id="nome"
              type="text"
              autoComplete="given-name"
              placeholder="Seu nome"
              className="lead-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="sobrenome">
              Sobrenome
            </label>
            <input
              id="sobrenome"
              type="text"
              autoComplete="family-name"
              placeholder="Seu sobrenome"
              className="lead-input"
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3.5">
          <label className="field-label" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            className="lead-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-10">
          <label className="field-label" htmlFor="whatsapp">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="numeric"
            placeholder="(81) 99999-9999"
            className="lead-input"
            value={formatPhoneBR(whatsapp)}
            onChange={(e) =>
              setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 11))
            }
          />
        </div>

        <div className="mt-auto space-y-2">
          <button
            type="submit"
            disabled={!valid || submitting}
            className="cta-primary w-full"
          >
            {submitting ? "Gerando..." : "Ver meu diagnóstico →"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full text-center text-sm text-white/30 hover:text-white/55 transition-colors py-2"
          >
            ← Voltar
          </button>
        </div>
      </form>
    </div>
  );
}
