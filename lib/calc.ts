import { formatBRL, pct } from "./format";

export type TipoNegocio = "oficina" | "autopecas" | "ambos";
export type Regime = "simples" | "presumido" | "real" | "nao-sei";
export type SimNaoNaoSei = "sim" | "nao" | "nao-sei";
export type FrequenciaNF = "sempre" | "maioria" | "raramente";
export type TempoEmpresa = "menos1" | "1a2" | "mais2";

export interface CalcInput {
  tipo: TipoNegocio;
  regime: Regime;
  faturamentoMensal: number;
  impostoMensal: number;
  folhaMensal: number;
  comprasMensal: number;
  proLabore?: SimNaoNaoSei;
  emiteNF?: FrequenciaNF;
  tempo?: TempoEmpresa;
}

export interface Oportunidade {
  icon: string;
  title: string;
  desc: string;
}

export interface CalcResult {
  titulo: string;
  diag: string;
  impostoAtualMensal: number;
  impostoOtimizadoMensal: number;
  impostoAtualAnual: number;
  impostoOtimizadoAnual: number;
  faturamentoAnual: number;
  economiaAnual: number;
  reducaoPct: number;
  cargaAtualPct: string;
  cargaOtimizadaPct: string;
  oportunidades: Oportunidade[];
  fatorR: number;
}

/**
 * Lógica de cálculo portada do HTML calculadora-oficina/index.html.
 * Estimativa pra diagnóstico — não substitui análise tributária formal.
 */
export function calcular(input: CalcInput): CalcResult {
  const {
    tipo,
    regime,
    faturamentoMensal: fat,
    impostoMensal: imp,
    folhaMensal: folha,
    comprasMensal: compras,
  } = input;

  const fatAnual = fat * 12;
  const impAnual = imp * 12;
  const fatR = folha > 0 && fat > 0 ? folha / fat : 0;

  let impOtim = imp;
  const ops: Oportunidade[] = [];
  let diag = "";

  // ── Simples Nacional ──
  if (regime === "simples") {
    if (tipo === "oficina" || tipo === "ambos") {
      let aliq: number;
      if (fatAnual <= 180_000) aliq = fatR >= 0.28 ? 0.06 : 0.155;
      else if (fatAnual <= 360_000) aliq = fatR >= 0.28 ? 0.112 : 0.18;
      else if (fatAnual <= 720_000) aliq = fatR >= 0.28 ? 0.135 : 0.195;
      else if (fatAnual <= 1_800_000) aliq = fatR >= 0.28 ? 0.16 : 0.205;
      else if (fatAnual <= 3_600_000) aliq = fatR >= 0.28 ? 0.21 : 0.23;
      else aliq = fatR >= 0.28 ? 0.33 : 0.305;

      impOtim = fat * aliq;

      if (fatR < 0.28 && folha > 0) {
        const falta = 0.28 * fat - folha;
        ops.push({
          icon: "💡",
          title: "Otimização do Fator R — impacto imediato",
          desc: `Seu Fator R está em ${(fatR * 100).toFixed(
            0
          )}%. Com um ajuste de ${formatBRL(
            falta
          )}/mês na folha ou pró-labore, você migra do Anexo V para o Anexo III — a alíquota pode cair até 15 pontos percentuais.`,
        });
        impOtim = fat * aliq * 0.7;
        diag = `<strong>⚠️ Alerta Fator R:</strong> Sua relação folha/faturamento está em ${(fatR * 100).toFixed(
          0
        )}%, abaixo dos 28% necessários para o Anexo III. Você pode estar pagando alíquota até 15 pontos percentuais mais alta do que deveria.`;
      } else if (fatR >= 0.28) {
        diag = `<strong>✅ Fator R em dia:</strong> Você já está no Anexo III (Fator R de ${(fatR * 100).toFixed(
          0
        )}%). O foco agora é recuperar créditos retroativos e segregar peças de serviços.`;
      }
    }

    if (tipo === "autopecas") {
      let aliq: number;
      if (fatAnual <= 180_000) aliq = 0.04;
      else if (fatAnual <= 360_000) aliq = 0.073;
      else if (fatAnual <= 720_000) aliq = 0.095;
      else if (fatAnual <= 1_800_000) aliq = 0.107;
      else if (fatAnual <= 3_600_000) aliq = 0.143;
      else aliq = 0.19;
      impOtim = fat * aliq;
      diag = `<strong>📊 Autopeças — Simples Anexo I:</strong> A alíquota esperada para o seu faturamento é ${(
        aliq * 100
      ).toFixed(
        1
      )}%. As oportunidades principais estão em créditos de ICMS e na correta segregação de operações.`;
    }

    if (tipo === "ambos") impOtim = fat * 0.085;
  }

  // ── Lucro Presumido ──
  else if (regime === "presumido") {
    if (tipo === "oficina") {
      const aliqSv = fatAnual <= 720_000 ? 0.13 : 0.16;
      const simplesOtim = fat * aliqSv * (fatR >= 0.28 ? 0.85 : 1);
      if (simplesOtim < imp * 0.9) {
        impOtim = simplesOtim;
        ops.push({
          icon: "🔄",
          title: "Migração para o Simples Nacional",
          desc: "Para oficinas com faturamento até R$ 4,8M/ano, o Simples com Fator R otimizado pode ser significativamente mais vantajoso que o Lucro Presumido, onde ISS + PIS/COFINS + IRPJ/CSLL incidem sobre base de 32%.",
        });
      } else {
        impOtim = imp * 0.86;
      }
    }
    if (tipo === "autopecas") {
      const cred = compras * 0.0925;
      impOtim = imp - cred;
      ops.push({
        icon: "📦",
        title: "Créditos de PIS/COFINS sobre compras",
        desc: `Sobre ${formatBRL(
          compras
        )}/mês em compras você tem direito a ${formatBRL(
          cred
        )}/mês em créditos de PIS/COFINS (9,25%). Se não estiver aproveitando, são ${formatBRL(
          cred * 12
        )}/ano perdidos.`,
      });
    }
    if (tipo === "ambos") impOtim = imp * 0.8;
    if (!diag) {
      diag = `<strong>📊 Lucro Presumido:</strong> Dependendo da estrutura de custos e do Fator R, a migração para o Simples Nacional pode gerar economia imediata. A análise comparativa é o primeiro passo.`;
    }
  }

  // ── Lucro Real ──
  else if (regime === "real") {
    const cred = compras * 0.0925;
    impOtim = imp - cred;
    ops.push({
      icon: "📦",
      title: "Aproveitamento de créditos PIS/COFINS",
      desc: `No Lucro Real, ${formatBRL(
        compras
      )}/mês em compras geram ${formatBRL(
        cred
      )}/mês em créditos (9,25%) — ${formatBRL(
        cred * 12
      )}/ano que devem ser integralmente abatidos.`,
    });
    diag = `<strong>📊 Lucro Real:</strong> O foco é garantir 100% dos créditos de PIS/COFINS e revisar deduções de despesas operacionais que reduzem a base de IRPJ e CSLL.`;
  }

  // ── Não sei ──
  else {
    impOtim = imp * 0.78;
    diag = `<strong>📋 Próximo passo:</strong> Identificar seu regime é essencial. Para a maioria das oficinas e autopeças, o Simples Nacional com Fator R bem estruturado é o mais vantajoso — mas isso precisa ser validado com análise dos seus dados reais.`;
  }

  // ── Oportunidades adicionais ──
  if (input.proLabore === "nao") {
    ops.push({
      icon: "👔",
      title: "Estruturar o pró-labore do sócio",
      desc: "Sem pró-labore declarado, a distribuição de lucros pode gerar autuação. Estruturando corretamente, é possível reduzir a carga tributária sobre os rendimentos do sócio.",
    });
  }
  if (compras > fat * 0.25 && fat > 0) {
    ops.push({
      icon: "🔩",
      title: "Segregação fiscal: peça × mão de obra",
      desc: `Com ${pct(
        compras,
        fat
      )} do faturamento em compras, separar fiscalmente a venda de peças do serviço pode reduzir a base de ISS e otimizar ICMS-ST sobre as peças.`,
    });
  }
  if (input.emiteNF === "raramente") {
    ops.push({
      icon: "🧾",
      title: "Regularização da emissão de NF",
      desc: "Emitir nota em toda operação protege juridicamente o negócio e abre direito a créditos tributários que hoje estão sendo perdidos.",
    });
  }
  ops.push({
    icon: "🏛️",
    title: "Recuperação retroativa de créditos (até 5 anos)",
    desc: "Erros de enquadramento ou alíquotas indevidas nos últimos 60 meses podem ser restituídos via processo administrativo ou judicial.",
  });

  // ── Sanidade ──
  if (impOtim >= imp) impOtim = imp * 0.82;
  if (impOtim < 0) impOtim = imp * 0.7;

  const impOtimAnual = impOtim * 12;
  const economiaAnual = impAnual - impOtimAnual;
  const reducaoPct =
    impAnual > 0 ? Math.round((economiaAnual / impAnual) * 100) : 0;

  const titulo =
    economiaAnual > 60_000
      ? `Sua empresa pode economizar ${formatBRL(economiaAnual)} por ano.`
      : economiaAnual > 25_000
      ? `Identificamos ${formatBRL(
          economiaAnual
        )}/ano em oportunidade tributária.`
      : "Diagnóstico tributário concluído.";

  return {
    titulo,
    diag,
    impostoAtualMensal: imp,
    impostoOtimizadoMensal: impOtim,
    impostoAtualAnual: impAnual,
    impostoOtimizadoAnual: impOtimAnual,
    faturamentoAnual: fatAnual,
    economiaAnual,
    reducaoPct,
    cargaAtualPct: pct(impAnual, fatAnual),
    cargaOtimizadaPct: pct(impOtimAnual, fatAnual),
    oportunidades: ops,
    fatorR: fatR,
  };
}
