import type { CalcResult, TipoNegocio, Regime } from "./calc";
import { formatBRL } from "./format";

export const WHATSAPP_DESTINO = "558173049598";

const TIPO_LABELS: Record<TipoNegocio, string> = {
  oficina: "Oficina Mecânica",
  autopecas: "Autopeças",
  ambos: "Oficina + Autopeças",
};

const REGIME_LABELS: Record<Regime, string> = {
  simples: "Simples Nacional",
  presumido: "Lucro Presumido",
  real: "Lucro Real",
  "nao-sei": "Não identificado",
};

export interface LeadData {
  nome: string;
  sobrenome: string;
  email: string;
  whatsapp: string;
  tipo: TipoNegocio;
  regime: Regime;
}

export function tipoLabel(t: TipoNegocio): string {
  return TIPO_LABELS[t];
}
export function regimeLabel(r: Regime): string {
  return REGIME_LABELS[r];
}

export function buildImageURL(
  origin: string,
  lead: Pick<LeadData, "nome">,
  result: CalcResult
): string {
  const params = new URLSearchParams({
    nome: lead.nome,
    eco: String(Math.round(result.economiaAnual)),
    atual: String(Math.round(result.impostoAtualAnual)),
    otim: String(Math.round(result.impostoOtimizadoAnual)),
    red: String(result.reducaoPct),
    fat: String(Math.round(result.faturamentoAnual)),
  });
  return `${origin}/api/result-image?${params.toString()}`;
}

export function buildWhatsAppMessage(
  lead: LeadData,
  result: CalcResult,
  imageURL?: string
): string {
  const primeiroNome = lead.nome.trim().split(/\s+/)[0];
  const linhas: string[] = [
    `Olá Q&M Consultoria! Sou ${primeiroNome}, acabei de simular minha economia tributária pela calculadora de oficinas.`,
    ``,
    `*Meus dados:*`,
    `Tipo de negócio: ${tipoLabel(lead.tipo)}`,
    `Regime atual: ${regimeLabel(lead.regime)}`,
    `Faturamento anual: ${formatBRL(result.faturamentoAnual)}`,
    `Imposto atual: ${formatBRL(result.impostoAtualAnual)}/ano`,
    ``,
    `*Diagnóstico:*`,
    `Economia potencial: ${formatBRL(result.economiaAnual)}/ano`,
    `Redução estimada: ${result.reducaoPct}%`,
    ``,
  ];
  if (imageURL) linhas.push(`Veja minha análise completa: ${imageURL}`, ``);
  linhas.push(`Quero entender como reduzir esses impostos na minha empresa.`);
  return linhas.join("\n");
}

export function buildWhatsAppURL(message: string): string {
  return `https://wa.me/${WHATSAPP_DESTINO}?text=${encodeURIComponent(
    message
  )}`;
}
