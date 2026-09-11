# Arquitetura

Este documento explica o fluxo de execução do app e as camadas envolvidas.
Complementa o `README.md` (visão geral) e o `DATABASE.md` (banco).

---

## Camadas em ordem de execução

```
1. Vercel serve dist/spa/index.html
        ↓
2. main.js do Quasar inicializa Vue + Pinia + Router
        ↓
3. Boots rodam em ordem:
     boot/pinia.js       → cria store instance
     boot/supabase.js    → cria cliente, chama authStore.iniciarSessaoAction()
        ↓
4. Router monta e beforeEach roda em cada navegação:
     - Se meta.requerAuth && !autenticado → /login
     - Se autenticado tentando /login ou /cadastro → /dashboard
     - Se autenticado sem onboarding_done_<userId> em localStorage → /onboarding
        ↓
5. Layout escolhido (PublicLayout ou MainLayout) renderiza <router-view/>
        ↓
6. Page monta, dispara watch(() => authStore.profissionalId, ...) para carregar
   dados via stores (setListXAction).
        ↓
7. Stores fazem query no Supabase (com RLS aplicado) e populam state.
        ↓
8. Componentes reagem ao state (computeds → template).
```

---

## Auth

Toda a autenticação vive no `authStore` (`src/stores/authStore.js`) e usa
`supabase.auth`:

- **`iniciarSessaoAction()`** — chamada no `boot/supabase.js`. Restaura sessão
  do `localStorage` (Supabase persiste automaticamente) e carrega o perfil profissional.
- **`onAuthStateChange`** — listener registrado em `boot/supabase.js`. Sempre
  que o usuário loga/desloga (inclusive via OAuth), chama `setarSessaoAction()`.
- **`loginAction` / `loginGoogleAction` / `cadastrarAction`** — expostas para
  as pages de login/cadastro. Retornam `{ sucesso, retorno, mensagem, status_code }`.
- **`carregarPerfilAction()`** — busca em `profissionais` por `user_id = auth.uid()`.
  Se não achar (primeiro login via OAuth), cria o perfil automaticamente com um
  slug gerado a partir do nome.

### Fluxo de cadastro

```
CadastroPage → authStore.cadastrarAction({ email, senha, nome_completo })
    ↓
supabase.auth.signUp()
    ↓
Se data.user.identities.length === 0 → e-mail já cadastrado (hack do Supabase)
Se !data.session → precisa confirmar e-mail → retorna 'confirmar_email'
Se data.session (confirmação desabilitada no projeto) → cria profissional agora
```

### Redirect após login

Router usa `?redirect=/rota-original` para levar o usuário de volta pra onde
tentava ir antes de ser mandado pro login. LoginPage lê `route.query.redirect`.

---

## State (Pinia)

Todas as stores seguem o **mesmo padrão** — vale abrir uma qualquer e ler:

```
state: {
  carregando: bool,
  configs: { data_inicio, data_fim, filter_* },   // parâmetros da última query
  item: {},                                        // item corrente (edição)
  lista_items: [],                                 // lista carregada
}

getters: {
  // filtros derivados (por status, por dia, agrupamentos)
}

actions: {
  setListItemsAction(obj?)   // GET lista com filtros de obj
  setItemByIdAction(obj)     // GET item por id
  postItemAction(obj)        // INSERT
  putItemAction(obj)         // UPDATE
  deleteItemAction(obj)      // DELETE (às vezes soft delete)
  iniciarItemAction(obj?)    // clone/reset do item corrente
}
```

**Todas** as actions retornam `{ sucesso, retorno, mensagem, status_code }` e
aceitam `obj.callback` opcional (padrão de callback do time).

Passar `obj.preventState = true` faz a action rodar a query mas **não** sobrescrever
o state — útil para query pontual (autocomplete, verificação).

### Stores existentes

| Store                 | Responsabilidade                                                   |
| --------------------- | ------------------------------------------------------------------ |
| `authStore`           | Sessão, usuário, perfil profissional (`profissional`), slug, login/logout |
| `agendamentosStore`   | CRUD agendamentos + getters `agendamentos_hoje`, `total_faltas_mes` |
| `pacientesStore`      | CRUD pacientes (a tabela `pacientes` estende `contatos` via 1:1)   |
| `contatosStore`       | CRUD contatos genéricos (85% igual ao pacientesStore — candidato a factory) |
| `disponibilidadeStore`| Horários semanais, tipos de atendimento, bloqueios (3 domínios juntos) |

---

## Composables

Camada fina sobre as stores, útil quando a mesma operação é usada em várias
pages e envolve `$q.notify` (toast). Se só um lugar consome, prefira usar a
store direto.

| Composable            | O que faz                                                                    |
| --------------------- | ---------------------------------------------------------------------------- |
| `useAgendamentos`     | Ações de status (confirmar, realizar, falta, cancelar) + agrupamento por hora |
| `useAnexos`           | Upload (Storage + insert em `anexos`), exclusão, link compartilhável assinado |
| `useDisponibilidade`  | Gera slots de horário disponíveis para uma data + filtra ocupados            |
| `usePacientes`        | Wrapper com `$q.dialog` de confirmação para remoção                          |

---

## Router

Todas as rotas em `src/router/routes.js`:

- **Públicas** (sem `meta.requerAuth`): `/login`, `/cadastro`, `/agendar/:slug`
  (agendamento público — ainda placeholder).
- **Autenticadas** (`meta.requerAuth: true`):
  - `/onboarding` — wizard de 3 passos usando `PublicLayout` (sem sidebar).
  - `/dashboard`, `/agenda`, `/pacientes`, `/pacientes/:id`, `/configuracoes` — dentro do `MainLayout`.
- **404**: `/:catchAll(.*)*` → `ErrorNotFoundPage`.

Guard global (`src/router/index.js`) faz 3 coisas:

1. Bloqueia rota com `meta.requerAuth` se não autenticado → redireciona pra `/login?redirect=<destino>`.
2. Bloqueia `/login` e `/cadastro` para quem já está autenticado → manda pra `/dashboard`.
3. Força `/onboarding` até o usuário setar a flag `onboarding_done_<userId>` no `localStorage`.
   (⚠️ ver `TODO(onboarding)` — deveria ser coluna em `profissionais`.)

---

## Layouts

- **`PublicLayout.vue`** — container mínimo com `<router-view/>`. Usado por login,
  cadastro, agendamento público e onboarding.
- **`MainLayout.vue`** — header (toggle sidebar, status WhatsApp, notificações,
  dark mode, menu do usuário) + sidebar retrátil (dashboard, agenda, pacientes,
  configurações) + `<router-view/>`.

O sidebar tem dois modos: expandido (232px, labels visíveis) e mini (56px, só
ícones com tooltip). Muda com o botão hambúrguer no desktop; no mobile é drawer.

---

## Serviços

`src/services/supabase.js` — **única** instância do cliente Supabase.
- `persistSession: true` — sessão fica no localStorage.
- `autoRefreshToken: true` — refresh automático antes de expirar.
- `detectSessionInUrl: true` — captura tokens de OAuth callback.

Se alguma env var faltar, loga erro no console. Não crashar aqui é intencional
(dev pode estar debugando algo que não precisa de Supabase).

---

## CSS / Design System

`src/css/app.scss` define **design tokens** como CSS custom properties:

- Radius, spacing.
- Cores light mode (`:root`) e dark mode (`body.body--dark`).
- Cores de status (`--status-agendado`, `--status-confirmado`, ...).
- Classes utilitárias: `.t-h1`, `.t-h2`, `.t-h3`, `.t-small`, `.t-tiny`, `.t-num`.
- Componentes: `.atende-card`, `.badge`, `.atende-tag`, `.av`, `.row-hover`,
  `.atende-tab`, `.seg`, `.upload-zone`.

Dark mode é controlado pelo plugin Dark do Quasar (`$q.dark.toggle()`).

Muito CSS ainda está **inline** nos templates (`style="..."`) — isso é dívida,
mas foi decisão de velocidade no MVP. Se for refatorar, extrair para classes
utilitárias no `app.scss`.

---

## Constantes centralizadas

`src/constants/`:

| Arquivo              | O que exporta                                                     |
| -------------------- | ----------------------------------------------------------------- |
| `status.js`          | `STATUS_AGENDAMENTO` (enum, reexport do store) e `STATUS_LABELS`  |
| `tags.js`            | `TAGS_PACIENTE` — usadas em filtros e cadastro                    |
| `especialidades.js`  | `ESPECIALIDADES` — opções do select no perfil                     |
| `dias.js`            | `DIAS_SEMANA`, `DIAS_SEMANA_UTEIS`, `DIAS_LABEL_CURTO`            |

**Regra:** se uma constante for usada em mais de um lugar, ela vive aqui.
Nunca copie/cole array de labels entre pages — importe.
