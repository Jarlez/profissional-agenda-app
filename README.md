# Agenda App — Atende

SaaS de agendamento para **profissionais de saúde autônomos** (fisioterapeutas,
psicólogos, nutricionistas, personal trainers). O profissional gerencia agenda,
pacientes, tipos de atendimento e recebe agendamentos via link público que
pode compartilhar em Instagram, WhatsApp ou cartão de visita.

> **Status:** MVP em desenvolvimento. Página pública de agendamento e integração
> com WhatsApp ainda não implementadas — busque por `TODO(` no código para ver o que falta.

---

## Stack

| Camada          | Tecnologia                                          |
| --------------- | --------------------------------------------------- |
| Framework UI    | [Quasar 2](https://quasar.dev) + Vue 3 (`<script setup>`) |
| State           | [Pinia](https://pinia.vuejs.org) (Options API)      |
| Roteamento      | Vue Router 4 (modo `history`)                       |
| Bundler         | Vite 5                                              |
| Backend (BaaS)  | [Supabase](https://supabase.com) — Postgres + Auth + Storage + RLS |
| Datas           | dayjs                                               |
| Deploy          | [Vercel](https://vercel.com) (SPA, `dist/spa`)      |
| Linter/Format   | ESLint (flat config) + Prettier                     |

**Ainda não temos:** TypeScript, testes automatizados, CI. Ver a seção
[Próximos passos](#próximos-passos).

---

## Como rodar localmente

Pré-requisitos: Node 18 ou 20, npm.

```bash
# 1) Clonar e instalar
git clone https://github.com/Jarlez/profissional-agenda-app.git
cd profissional-agenda-app
npm install

# 2) Criar seu .env a partir do template
cp .env.example .env
# Editar .env com as chaves do Supabase (Settings → API no dashboard)

# 3) Rodar dev server (abre http://localhost:9000)
npm run dev
```

### Scripts disponíveis

| Comando            | O que faz                                             |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Dev server Quasar em `http://localhost:9000` (hot reload) |
| `npm run build`    | Build de produção em `dist/spa/`                      |
| `npm run build:pwa`| Build PWA em `dist/pwa/`                              |
| `npm run lint`     | ESLint (⚠️ usar `npx eslint src/` — o script tem flag antiga do ESLint 8) |
| `npm run format`   | Prettier em todos os arquivos                         |

---

## Setup do Supabase

Se estiver começando do zero (novo projeto Supabase):

1. Criar projeto em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Ir em **SQL Editor** e rodar as migrations em ordem numérica
   (`supabase/migrations/001_...sql` → `009_...sql`).
3. Habilitar **Storage** e criar bucket público chamado `anexos`
   (usado pelo composable `useAnexos.js`).
4. Em **Authentication → Providers**, habilitar Email/Password e, opcionalmente,
   Google OAuth (usado por `authStore.loginGoogleAction()`).
5. Copiar `URL` e `anon key` de **Settings → API** para o `.env`.

RLS já vem configurado nas próprias migrations — cada profissional só enxerga
seus próprios dados. Ver [`docs/DATABASE.md`](./docs/DATABASE.md).

---

## Estrutura de pastas

```
agenda-app/
├── docs/                    ← Documentação técnica (arquitetura, banco)
├── src/
│   ├── boot/                ← Boot files do Quasar (pinia, supabase)
│   ├── components/          ← (vazio hoje — componentes reutilizáveis vão aqui)
│   ├── composables/         ← Funções compostas Vue 3 (useAgendamentos, useAnexos, ...)
│   ├── constants/           ← Constantes centralizadas (status, tags, dias, ...)
│   ├── css/                 ← app.scss com design tokens (CSS custom props + dark mode)
│   ├── layouts/             ← MainLayout (autenticado) e PublicLayout
│   ├── pages/               ← Páginas de rota
│   │   ├── auth/            ← LoginPage, CadastroPage
│   │   └── public/          ← AgendamentoPublicoPage
│   ├── router/              ← Vue Router + guard global de auth/onboarding
│   ├── services/            ← Cliente Supabase (fábrica única)
│   ├── stores/              ← Stores Pinia (auth, agendamentos, pacientes, ...)
│   └── utils/               ← Helpers puros (formatação, validação)
├── supabase/
│   └── migrations/          ← SQL numerado (001 a 009)
├── .env.example             ← Template — copiar para .env
├── quasar.config.js         ← Config do Quasar (boots, plugins, PWA, build target)
├── vercel.json              ← Build command + rewrites SPA
└── package.json
```

---

## Como funciona (visão de 5 minutos)

- **Boot** (`src/boot/`): registra Pinia e o cliente Supabase, restaura sessão.
- **Router** (`src/router/index.js`): guard global que protege rotas com `meta.requerAuth`
  e força o onboarding no primeiro login (⚠️ hoje flag em `localStorage` — TODO já marcado).
- **Layouts**: `PublicLayout` (login/cadastro/agendamento público) e `MainLayout`
  (header + sidebar + `router-view` para o app autenticado).
- **Pages**: cada rota é uma page (`DashboardPage`, `AgendaPage`, `PacientesPage`,
  `PacienteDetalhePage`, `ConfiguracoesPage`, `OnboardingPage`).
- **Stores** (Pinia, Options API): cada domínio tem sua store com padrão
  `setListXAction`, `postXAction`, `putXAction`, `deleteXAction`.
  Todas as actions retornam `{ sucesso, retorno, mensagem, status_code }`.
- **Composables**: wrappers de alto nível que combinam store + notificação Quasar
  (útil quando a mesma operação é chamada de várias pages).
- **Supabase**: cliente único exportado de `src/services/supabase.js`. Todo acesso
  ao banco passa por RLS — não existe service key no front.

Ver [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) para o fluxo detalhado,
[`docs/DATABASE.md`](./docs/DATABASE.md) para o modelo do banco e
[`docs/BACKLOG.md`](./docs/BACKLOG.md) para os pontos de melhoria já mapeados.

---

## Convenções de código

- **Idioma:** código, comentários e mensagens de erro em **pt-BR** (`autenticacao` em
  vez de `authentication`, `sucesso` em vez de `success` etc.).
- **Naming:**
  - `refs` / state de store em **snake_case** (`lista_agendamentos`, `carregando`).
  - Funções, computeds e composables em **camelCase** (`carregarPerfilAction`, `usePacientes`).
  - Actions da store terminam em **`Action`** (`setListPacientesAction`).
- **Retorno de actions:** sempre `{ sucesso, retorno, mensagem, status_code }`
  (padrão do time). Ver `helpers.retornoPadrao()`.
- **Callback opcional:** actions aceitam `obj.callback(resultado)` para quem quer usar
  callback em vez de `await`.
- **`preventState`:** passar `preventState: true` para uma action que apenas retorna
  dados sem sobrescrever o state (útil para autocomplete e queries pontuais).
- **Constantes centralizadas:** nada de repetir `LABELS`/`TAGS`/`STATUS` inline —
  usar `src/constants/`.
- **Sem `console.log` esquecido.** `console.error` OK para erros inesperados.

---

## Deploy (Vercel)

Já configurado (`vercel.json`):

- **Framework:** Vite (Quasar por baixo).
- **Build:** `quasar build`
- **Output:** `dist/spa`
- **Rewrites:** `/(.*)` → `/index.html` (para Vue Router em modo `history`).
- **URL de produção:** https://profissional-agenda-app.vercel.app

Env vars (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) precisam estar
configuradas em **Vercel → Project → Settings → Environment Variables**
para Production, Preview e Development. Deploy automático em cada push na `main`.

---

## O que ainda precisa ser feito (search por `TODO(` no código)

- [ ] **`TODO(agendamento-publico)`** — `src/pages/public/AgendamentoPublicoPage.vue`
      está como placeholder. É o core do produto: paciente acessa
      `/agendar/:slug`, escolhe horário e agenda sem cadastro.
- [ ] **`TODO(whatsapp)`** — Integração com Evolution API. Envolve:
      nova coluna `whatsapp_conectado` em `profissionais`, tela de QR code real
      (hoje o QR do onboarding é ícone estático) e envio de lembretes automáticos.
- [ ] **`TODO(onboarding)`** — Flag `onboarding_concluido` deve virar coluna
      em `profissionais`, não `localStorage` (hoje quebra se o usuário limpar cache).
- [ ] **`TODO(agenda-horas)`** — Grade da agenda é fixa 07h-19h; derivar do
      `hora_inicio`/`hora_fim` das disponibilidades ativas.
- [ ] **`TODO(whatsapp-badge)`** — Badge "Conectado" hardcoded em Configurações.

---

## Próximos passos (discussão aberta)

Não foram implementados porque envolvem decisão de time / mais tempo:

- **TypeScript** — hoje é JS puro. Migração gradual `.js` → `.ts` com JSDoc primeiro seria uma boa.
- **Testes** — Vitest + Vue Test Utils. Prioridade: stores (`authStore`,
  `agendamentosStore`) e `utils/helpers.js`.
- **Quebrar componentes grandes** — `AgendaPage`, `ConfiguracoesPage`,
  `PacienteDetalhePage` passam de 400 linhas. Extrair para `src/components/`.
- **Validação de upload** — `useAnexos.js` aceita qualquer arquivo/tamanho.
  Adicionar guarda de MIME e tamanho máximo.
- **Slug único de verdade** — `authStore.gerarSlugUnico()` usa random sem checar
  colisão no banco. Mover para trigger PG ou validar antes do insert.
- **Edge Functions** — envio de notificações (email/WhatsApp) precisa acontecer
  server-side. Colocar em `supabase/functions/`.

---

## Suporte

- Dúvidas gerais: perguntar no time (ainda sem Slack/Discord dedicado).
- Bugs: abrir issue no repositório com passos pra reproduzir + versão do browser.
