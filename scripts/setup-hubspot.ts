/**
 * Setup automático do HubSpot — cria as 4 propriedades customizadas via API.
 *
 * Idempotente: pode rodar várias vezes sem causar problema.
 * Se a propriedade já existir, ele só pula (não sobrescreve).
 *
 * Pré-requisito: HUBSPOT_PRIVATE_APP_TOKEN no .env.local
 * Como gerar: HubSpot → Configurações → Integrações → Apps privados →
 *   Criar app privado → Escopos: crm.schemas.contacts.write + crm.objects.contacts.read
 *
 * Rodar: npm run setup:hubspot
 */

import fs from "node:fs";
import path from "node:path";

// ── Carrega .env.local manualmente (não dependemos de dotenv) ──────────────
function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] === undefined) {
      let v = m[2];
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}
loadEnv();

const TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
if (!TOKEN) {
  console.error(
    "❌ HUBSPOT_PRIVATE_APP_TOKEN não encontrada em .env.local\n\n" +
      "Como gerar:\n" +
      "  1. HubSpot → Configurações (engrenagem) → Integrações → Apps privados\n" +
      "  2. Criar app privado → dá um nome (ex: 'Setup Calculadora')\n" +
      "  3. Aba 'Escopos' → marca:\n" +
      "       - crm.schemas.contacts.write\n" +
      "       - crm.objects.contacts.read\n" +
      "  4. Salvar → copia o 'Token de acesso'\n" +
      "  5. Cola em .env.local: HUBSPOT_PRIVATE_APP_TOKEN=seu_token_aqui\n" +
      "  6. Roda de novo: npm run setup:hubspot\n"
  );
  process.exit(1);
}

const API = "https://api.hubapi.com/crm/v3/properties/contacts";

// ── Definição das propriedades ─────────────────────────────────────────────
type PropertyDef = {
  name: string;
  label: string;
  type: "enumeration" | "number";
  fieldType: "select" | "number";
  description?: string;
  options?: { label: string; value: string }[];
};

const PROPERTIES: PropertyDef[] = [
  {
    name: "vertical",
    label: "Vertical",
    type: "enumeration",
    fieldType: "select",
    description:
      "Nicho do lead (qual calculadora gerou). Útil para filtrar campanhas.",
    options: [
      { label: "Médico/Saúde", value: "Médico/Saúde" },
      { label: "Oficina/Autopecas", value: "Oficina/Autopecas" },
    ],
  },
  {
    name: "tipo_negocio",
    label: "Tipo de negócio",
    type: "enumeration",
    fieldType: "select",
    description:
      "Categoria informada na calculadora de oficinas/autopeças.",
    options: [
      { label: "Oficina Mecânica", value: "Oficina Mecânica" },
      { label: "Autopeças", value: "Autopeças" },
      { label: "Oficina + Autopeças", value: "Oficina + Autopeças" },
    ],
  },
  {
    name: "regime_atual",
    label: "Regime atual",
    type: "enumeration",
    fieldType: "select",
    description: "Regime tributário declarado na calculadora.",
    options: [
      { label: "Simples Nacional", value: "Simples Nacional" },
      { label: "Lucro Presumido", value: "Lucro Presumido" },
      { label: "Lucro Real", value: "Lucro Real" },
      { label: "Não identificado", value: "Não identificado" },
    ],
  },
  {
    name: "imposto_atual",
    label: "Imposto atual",
    type: "number",
    fieldType: "number",
    description:
      "Imposto mensal total informado pelo lead (DAS, IRPJ, CSLL, ISS, ICMS, PIS, COFINS).",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
type FetchResult<T> = { status: number; data: T };

async function call<T = unknown>(
  method: "GET" | "POST" | "PATCH",
  url: string,
  body?: unknown
): Promise<FetchResult<T>> {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: unknown = null;
  const text = await r.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: r.status, data: data as T };
}

function buildPayload(p: PropertyDef): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: p.name,
    label: p.label,
    type: p.type,
    fieldType: p.fieldType,
    groupName: "contactinformation",
    description: p.description ?? "",
  };
  if (p.options) {
    payload.options = p.options.map((o, i) => ({
      label: o.label,
      value: o.value,
      displayOrder: i,
      hidden: false,
    }));
  }
  if (p.type === "number") {
    payload.numberDisplayHint = "formatted";
  }
  return payload;
}

async function ensureProperty(p: PropertyDef): Promise<void> {
  const exists = await call(`GET`, `${API}/${p.name}`);
  if (exists.status === 200) {
    console.log(`✓ ${p.name.padEnd(30)} já existe — pulando`);
    return;
  }
  if (exists.status === 401) {
    throw new Error(
      "Token inválido (401). Verifica que copiou completo e que o app privado está ativo."
    );
  }
  if (exists.status === 403) {
    throw new Error(
      "Sem permissão (403). O app privado precisa do escopo 'crm.schemas.contacts.write'."
    );
  }
  if (exists.status !== 404) {
    console.warn(
      `⚠ ${p.name} retornou status inesperado ${exists.status} ao verificar:`,
      exists.data
    );
  }

  const payload = buildPayload(p);
  const created = await call(`POST`, API, payload);
  if (created.status === 201) {
    console.log(`✅ ${p.name.padEnd(30)} criada`);
  } else if (created.status === 409) {
    console.log(`✓ ${p.name.padEnd(30)} já existia (409) — ok`);
  } else {
    console.error(
      `❌ ${p.name.padEnd(30)} falhou (${created.status}):`,
      created.data
    );
    process.exitCode = 1;
  }
}

// ── Run ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🛠  Setup HubSpot — Calculadora Oficinas\n");
  console.log(`   Endpoint: ${API}`);
  console.log(`   Token: ${TOKEN!.slice(0, 8)}…${TOKEN!.slice(-4)}\n`);

  for (const p of PROPERTIES) {
    try {
      await ensureProperty(p);
    } catch (err) {
      console.error(`💥 Erro crítico em ${p.name}:`, err);
      process.exit(1);
    }
  }

  if (process.exitCode === 1) {
    console.log("\n⚠  Concluído com alguns erros. Verifica os logs acima.");
  } else {
    console.log("\n🎉 Tudo certo. Próximo passo: criar o formulário no HubSpot");
    console.log("   (drag-drop dos campos no Marketing → Formulários).\n");
    console.log("   Quando criar o form e pegar o Form GUID, cola no .env.local:");
    console.log("   HUBSPOT_FORM_GUID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\n");
  }
}

main().catch((err) => {
  console.error("💥 Erro inesperado:", err);
  process.exit(1);
});
