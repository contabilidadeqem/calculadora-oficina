# Calculadora Tributária — Oficinas & Autopeças

Funil de 8 passos que estima a economia tributária de oficinas mecânicas, autopeças e centros automotivos, identificando oportunidades como Fator R, créditos de PIS/COFINS e migração de regime.

Réplica adaptada do `index.html` original (single-file) para a mesma arquitetura **Next.js + HubSpot + Meta Pixel + CAPI + imagem PNG + wa.me** usada na `calculadora-saude`.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (paleta verde-petróleo + dourado oxidado)
- Inter (via `next/font`)
- Edge runtime para geração de imagem PNG (`@vercel/og`)

## Como rodar local

```powershell
cd C:\Users\jarde\calculadora-oficina
npm install
# crie .env.local com pelo menos NEXT_PUBLIC_META_PIXEL_ID (HUBSPOT é opcional)
npm run dev
```

Abre em `http://localhost:3000` (ou outra porta se 3000 estiver ocupada).

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Obrigatória | O que faz |
|---|---|---|
| `HUBSPOT_PORTAL_ID` | Não | Portal HubSpot (mesmo da calculadora-saude: `51315986`) |
| `HUBSPOT_FORM_GUID` | **Sim** para CRM | Form GUID de um novo formulário "Calculadora Oficinas". **CRIE UM NOVO** — não reusa o de médicos |
| `NEXT_PUBLIC_META_PIXEL_ID` | Sim para tracking | Mesmo Pixel da calculadora-saude (`1750106205658482`) — diferencia verticais por UTM |
| `META_PIXEL_ID` | Não | Igual ao acima — exposto também como server-side var |
| `META_CAPI_ACCESS_TOKEN` | Não | Token CAPI quando disponível |
| `META_CAPI_TEST_EVENT_CODE` | Não | Pra testar no painel "Eventos de Teste" |

## Setup HubSpot (~10 min)

Crie 6 propriedades customizadas de Contato (Configurações → Propriedades → Contato):

| Rótulo | Nome interno | Tipo | Notas |
|---|---|---|---|
| Vertical | `vertical` | Dropdown | "Médico/Saúde", "Oficina/Autopecas" |
| Tipo de negócio | `tipo_negocio` | Dropdown | "Oficina Mecânica", "Autopeças", "Oficina + Autopeças" |
| Regime atual | `regime_atual` | Dropdown | "Simples Nacional", "Lucro Presumido", "Lucro Real", "Não identificado" |
| Faturamento mensal | `faturamento_mensal` | Número (BRL) | (pode reusar a propriedade já existente da calc-saude) |
| Imposto atual | `imposto_atual` | Número (BRL) | Imposto mensal informado |
| Economia anual estimada | `economia_anual_estimada` | Número (BRL) | (pode reusar a propriedade já existente) |

Depois crie um formulário "Calculadora Oficinas Autopeças" com os campos padrão (firstname, lastname, email, phone) + as 6 customizadas acima. Pega o `formId` no código de incorporação e cola no `HUBSPOT_FORM_GUID`.

## Estrutura

```
calculadora-oficina/
├── app/
│   ├── api/
│   │   ├── lead/route.ts          — HubSpot Forms v2 + Meta CAPI server-side
│   │   └── result-image/route.tsx — PNG personalizado via Satori
│   ├── layout.tsx                 — shell + MetaPixel + Inter
│   ├── page.tsx                   — renderiza <Calculator />
│   └── globals.css                — Tailwind + componentes
├── components/
│   ├── Calculator.tsx             — state machine 8 steps + resultado
│   ├── Resultado.tsx              — tela final com cards + imagem + CTAs
│   ├── MetaPixel.tsx              — script Pixel client-side
│   ├── ProgressBar.tsx
│   ├── BackButton.tsx
│   ├── Footer.tsx
│   └── steps/
│       ├── Step1Tipo.tsx          — Oficina / Autopeças / Ambos
│       ├── Step2Regime.tsx        — Simples / Presumido / Real / Não sei
│       ├── MoneyStep.tsx          — Componente reusado (steps 3-6)
│       ├── Step7Detalhes.tsx      — Pró-labore + NF + Tempo (pills)
│       └── Step8Lead.tsx          — Nome / Sobrenome / Email / WhatsApp
├── lib/
│   ├── calc.ts                    — Lógica Fator R + Simples/Presumido/Real
│   ├── format.ts                  — Máscaras BRL e telefone
│   ├── pixel.ts                   — Helper tipado pra fbq()
│   └── whatsapp.ts                — Monta mensagem + URL wa.me
└── tailwind.config.ts
```

## Lógica de cálculo

Portada 1:1 do JavaScript original com tipagem TypeScript. Lógica resumida:

- **Simples Nacional + Oficina/Ambos:** Alíquota por faixa de faturamento + Fator R (≥28% → Anexo III). Se Fator R baixo, sugere ajuste e calcula economia de ~30% sobre alíquota.
- **Simples Nacional + Autopeças:** Anexo I (alíquotas mais baixas).
- **Lucro Presumido + Oficina:** Compara com Simples otimizado e sugere migração.
- **Lucro Presumido + Autopeças:** Calcula créditos PIS/COFINS de 9,25% sobre compras.
- **Lucro Real:** Foca em créditos PIS/COFINS.
- **Não sei:** Estimativa conservadora de 22% de economia.

**Sanidade:** Se `impOtim >= imp` aplica 18% de redução mínima. Se `impOtim < 0` aplica 30% de redução.

## Domínio sugerido

`oficina.qemconsultoria.com.br` (configura via Vercel Settings → Domains → adiciona subdomínio CNAME pra `cname.vercel-dns.com`).

## WhatsApp destino

`+55 81 7304-9598` (definido em `lib/whatsapp.ts` → `WHATSAPP_DESTINO`). Se quiser trocar, edita só essa constante.

## Dados do escritório (rodapé)

- **Nome:** Q&M Consultoria
- **Instagram:** @queirozemanoelconsultoria
- **CNPJ:** 58.848.633/0001-34
