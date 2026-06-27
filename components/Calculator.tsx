"use client";

import { useState, useMemo, useCallback } from "react";
import ProgressBar from "./ProgressBar";
import Footer from "./Footer";
import Step1Tipo from "./steps/Step1Tipo";
import Step2Regime from "./steps/Step2Regime";
import MoneyStep from "./steps/MoneyStep";
import Step7Detalhes from "./steps/Step7Detalhes";
import Step8Lead from "./steps/Step8Lead";
import Resultado from "./Resultado";
import {
  calcular,
  type TipoNegocio,
  type Regime,
  type SimNaoNaoSei,
  type FrequenciaNF,
  type TempoEmpresa,
} from "@/lib/calc";
import { trackEvent } from "@/lib/pixel";
import type { LeadData } from "@/lib/whatsapp";

const TOTAL = 8;

export default function Calculator() {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<TipoNegocio | null>(null);
  const [regime, setRegime] = useState<Regime | null>(null);
  const [faturamento, setFaturamento] = useState(0);
  const [imposto, setImposto] = useState(0);
  const [folha, setFolha] = useState(0);
  const [compras, setCompras] = useState(0);
  const [proLabore, setProLabore] = useState<SimNaoNaoSei | null>(null);
  const [emiteNF, setEmiteNF] = useState<FrequenciaNF | null>(null);
  const [tempo, setTempo] = useState<TempoEmpresa | null>(null);
  const [submittedLead, setSubmittedLead] = useState<LeadData | null>(null);

  const next = useCallback(() => setStep((s) => Math.min(TOTAL, s + 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(1, s - 1)), []);

  const restart = useCallback(() => {
    setSubmittedLead(null);
    setTipo(null);
    setRegime(null);
    setFaturamento(0);
    setImposto(0);
    setFolha(0);
    setCompras(0);
    setProLabore(null);
    setEmiteNF(null);
    setTempo(null);
    setStep(1);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const result = useMemo(() => {
    return calcular({
      tipo: tipo ?? "oficina",
      regime: regime ?? "nao-sei",
      faturamentoMensal: faturamento,
      impostoMensal: imposto,
      folhaMensal: folha,
      comprasMensal: compras,
      proLabore: proLabore ?? undefined,
      emiteNF: emiteNF ?? undefined,
      tempo: tempo ?? undefined,
    });
  }, [tipo, regime, faturamento, imposto, folha, compras, proLabore, emiteNF, tempo]);

  const showResult = submittedLead !== null;

  const handleAdvanceFromFaturamento = () => {
    trackEvent("ViewContent", {
      content_name: "Faturamento Informado (Oficina)",
      content_category: "Calculadora Oficina",
      currency: "BRL",
      value: faturamento,
    });
    next();
  };

  return (
    <main className="flex-1 flex flex-col">
      <section className="bg-hero flex-1">
        <div className="max-w-[680px] w-full mx-auto px-7 pt-12 pb-18 min-h-screen flex flex-col">
          {!showResult && (
            <>
              <ProgressBar step={step} total={TOTAL} />
              <div className="mb-13" />
            </>
          )}

          {!showResult && step === 1 && (
            <Step1Tipo value={tipo} onChange={setTipo} onNext={next} />
          )}
          {!showResult && step === 2 && (
            <Step2Regime
              value={regime}
              onChange={setRegime}
              onNext={next}
              onBack={back}
            />
          )}
          {!showResult && step === 3 && (
            <MoneyStep
              question="Qual é o faturamento mensal da sua empresa?"
              hint="Receita bruta total do mês — mesmo que parte ainda não seja emitida com nota fiscal."
              inputId="faturamento"
              placeholder="50.000"
              inputNote="Valor aproximado já gera um diagnóstico preciso"
              value={faturamento}
              minimum={1000}
              onChange={setFaturamento}
              onNext={handleAdvanceFromFaturamento}
              onBack={back}
            />
          )}
          {!showResult && step === 4 && (
            <MoneyStep
              question="Quanto você paga de imposto por mês no total?"
              hint="Some todos: DAS, IRPJ, CSLL, ISS, ICMS, PIS e COFINS. Estimativa está ótima."
              inputId="imposto"
              placeholder="3.500"
              inputNote="Se não souber o total, use o valor aproximado"
              value={imposto}
              minimum={50}
              onChange={setImposto}
              onNext={next}
              onBack={back}
            />
          )}
          {!showResult && step === 5 && (
            <MoneyStep
              question="Qual é o valor total da folha de pagamento mensal?"
              hint="Inclua salários + encargos (FGTS, INSS) de todos os colaboradores e o pró-labore dos sócios."
              inputId="folha"
              placeholder="8.000"
              inputNote="Esse dado é essencial para calcular o Fator R e encontrar a menor alíquota"
              value={folha}
              minimum={0}
              onChange={setFolha}
              onNext={next}
              onBack={back}
            />
          )}
          {!showResult && step === 6 && (
            <MoneyStep
              question="Quanto você investe em peças e insumos por mês?"
              hint="Compras de peças, materiais, óleos, pneus e outros insumos aplicados nos serviços ou revendidos."
              inputId="compras"
              placeholder="15.000"
              inputNote="Afeta o cálculo de créditos de PIS/COFINS e ICMS"
              value={compras}
              minimum={0}
              onChange={setCompras}
              onNext={next}
              onBack={back}
            />
          )}
          {!showResult && step === 7 && (
            <Step7Detalhes
              proLabore={proLabore}
              emiteNF={emiteNF}
              tempo={tempo}
              onProLabore={setProLabore}
              onEmiteNF={setEmiteNF}
              onTempo={setTempo}
              onNext={next}
              onBack={back}
            />
          )}
          {!showResult && step === 8 && tipo && regime && (
            <Step8Lead
              tipo={tipo}
              regime={regime}
              result={result}
              faturamentoMensal={faturamento}
              impostoMensal={imposto}
              onSubmitted={setSubmittedLead}
              onBack={back}
            />
          )}

          {showResult && submittedLead && (
            <Resultado
              lead={submittedLead}
              result={result}
              onRestart={restart}
            />
          )}

          <Footer />
        </div>
      </section>
    </main>
  );
}
