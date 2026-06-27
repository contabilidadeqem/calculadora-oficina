import { NextResponse } from "next/server";
import { createHash } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LeadRequest {
  nome: string;
  email: string;
  whatsapp: string;
  tipoInternal: string;
  regimeInternal: string;
  faturamentoMensal: number;
  impostoMensal: number;
  economiaAnual: number;
  impostoAtualAnual: number;
  impostoOtimizadoAnual: number;
  reducaoPct: number;
  pageUri?: string;
  eventId?: string;
  fbp?: string;
  fbc?: string;
}

function splitName(full: string): { firstname: string; lastname: string } {
  const parts = full.trim().split(/\s+/);
  const firstname = parts.shift() || "";
  const lastname = parts.join(" ");
  return { firstname, lastname };
}

function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length === 12 || digits.length === 13) return `+${digits}`;
  return raw;
}

function sha256(input: string): string {
  return createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

function getClientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri;
  return undefined;
}

async function sendMetaCAPI(opts: {
  body: LeadRequest;
  ipUserAgent: { ip?: string; ua?: string };
}): Promise<void> {
  const pixelId =
    process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE;
  if (!pixelId || !token) return;

  const { body, ipUserAgent } = opts;
  const phoneDigits = body.whatsapp.replace(/\D/g, "");

  const userData: Record<string, string | string[]> = {
    em: [sha256(body.email)],
    ph: [sha256(phoneDigits.length >= 12 ? phoneDigits : `55${phoneDigits}`)],
    fn: [sha256(body.nome.trim().split(/\s+/)[0] || "")],
    ln: [sha256(body.nome.trim().split(/\s+/).slice(1).join(" ") || "")],
    country: [sha256("br")],
  };
  if (ipUserAgent.ip) userData.client_ip_address = ipUserAgent.ip;
  if (ipUserAgent.ua) userData.client_user_agent = ipUserAgent.ua;
  if (body.fbp) userData.fbp = body.fbp;
  if (body.fbc) userData.fbc = body.fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: body.eventId,
        action_source: "website",
        event_source_url: body.pageUri,
        user_data: userData,
        custom_data: {
          currency: "BRL",
          value: Math.round(body.economiaAnual),
          content_name: "Calculadora Oficina Autopecas",
          content_category: body.tipoInternal,
          regime: body.regimeInternal,
          faturamento_mensal: Math.round(body.faturamentoMensal),
          imposto_mensal: Math.round(body.impostoMensal),
          economia_anual: Math.round(body.economiaAnual),
        },
      },
    ],
  };
  if (testCode)
    (payload as { test_event_code?: string }).test_event_code = testCode;

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const text = await r.text();
      console.error(
        "[/api/lead] Meta CAPI rejeitou:",
        r.status,
        text.slice(0, 500)
      );
    }
  } catch (err) {
    console.error("[/api/lead] Erro Meta CAPI:", err);
  }
}

async function sendHubSpot(body: LeadRequest): Promise<{
  ok: boolean;
  reason?: string;
  status?: number;
}> {
  const portalId = process.env.HUBSPOT_PORTAL_ID;
  const formGuid = process.env.HUBSPOT_FORM_GUID;

  if (!portalId || !formGuid) {
    console.warn(
      "[/api/lead] HUBSPOT_PORTAL_ID ou HUBSPOT_FORM_GUID não configurados — lead não foi enviado."
    );
    return { ok: false, reason: "hubspot_not_configured" };
  }

  const { firstname, lastname } = splitName(body.nome);
  const phone = sanitizePhone(body.whatsapp);

  const form = new URLSearchParams();
  form.set("firstname", firstname);
  form.set("lastname", lastname);
  form.set("email", body.email);
  form.set("phone", phone);
  form.set("vertical", "Oficina/Autopecas");
  form.set("tipo_negocio", body.tipoInternal);
  form.set("regime_atual", body.regimeInternal);
  form.set("faturamento_mensal", String(Math.round(body.faturamentoMensal)));
  form.set("imposto_atual", String(Math.round(body.impostoMensal)));
  form.set(
    "economia_anual_estimada",
    String(Math.round(body.economiaAnual))
  );

  const hsContext = {
    pageUrl: body.pageUri || "calculadora-oficina",
    pageName: "Calculadora Tributária — Oficinas & Autopeças",
  };
  form.set("hs_context", JSON.stringify(hsContext));

  const url = `https://forms.hubspot.com/uploads/form/v2/${portalId}/${formGuid}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (r.status === 204 || r.status === 200 || r.status === 302) {
      return { ok: true };
    }
    const text = await r.text();
    console.error(
      "[/api/lead] HubSpot rejeitou:",
      r.status,
      text.slice(0, 500)
    );
    return { ok: false, reason: "hubspot_error", status: r.status };
  } catch (err) {
    console.error("[/api/lead] Erro HubSpot:", err);
    return { ok: false, reason: "network_error" };
  }
}

export async function POST(req: Request) {
  let body: LeadRequest;
  try {
    body = (await req.json()) as LeadRequest;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad_json" },
      { status: 400 }
    );
  }

  if (!body.email || !body.nome || !body.whatsapp) {
    return NextResponse.json(
      { ok: false, reason: "missing_fields" },
      { status: 400 }
    );
  }

  const ipUserAgent = {
    ip: getClientIp(req),
    ua: req.headers.get("user-agent") || undefined,
  };

  const [hubspotResult] = await Promise.all([
    sendHubSpot(body),
    sendMetaCAPI({ body, ipUserAgent }),
  ]);

  return NextResponse.json(hubspotResult, { status: 200 });
}
