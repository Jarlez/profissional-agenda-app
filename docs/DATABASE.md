# Banco de dados (Supabase)

Modelo relacional em Postgres, com RLS ativa em todas as tabelas. Migrations
numeradas em `supabase/migrations/`.

Rodar em ordem numérica **no SQL Editor** do Supabase (ou via Supabase CLI).

---

## Visão geral

```
auth.users (gerido pelo Supabase Auth)
    │  (1:1 via user_id)
    ▼
profissionais ─────┬────────────────────────┬─────────────────────┐
    │              │                        │                     │
    │ 1:N          │ 1:N                    │ 1:N                 │ 1:N
    ▼              ▼                        ▼                     ▼
contatos       tipos_atendimento     disponibilidades         bloqueios
    │
    │ 1:1
    ▼
pacientes ─────► anexos (1:N)
    │
    │ 1:N (via contato_id)
    ▼
agendamentos ──► tipos_atendimento (N:1, opcional)
```

**Decisão-chave:** existe uma separação **core / vertical de saúde**:

- **Core (genérico):** `profissionais`, `contatos`, `tipos_atendimento`,
  `disponibilidades`, `bloqueios`, `agendamentos`. Nenhum campo com termo
  clínico. Serve para qualquer profissional autônomo (advogado, cabeleireiro etc.).
- **Vertical de saúde:** `pacientes` (que estende `contatos` 1:1) e `anexos`.
  Aqui entram dados clínicos: `data_nascimento`, `observacoes`, `tags`, arquivos.

Por isso `agendamentos.contato_id` referencia `contatos`, **não** `pacientes` — mesmo
no fluxo de saúde. Se um dia o produto virar multi-vertical, `agendamentos` já está pronto.

---

## Tabelas

### 001 `profissionais`

Estende `auth.users` com dados do profissional. Um `user_id` corresponde a um `profissional`.

| Coluna                 | Tipo         | Notas                                        |
| ---------------------- | ------------ | -------------------------------------------- |
| `id`                   | uuid PK      |                                              |
| `user_id`              | uuid UNIQUE  | FK `auth.users(id)`, on delete cascade       |
| `nome_completo`        | text         | not null                                     |
| `especialidade`        | text         |                                              |
| `slug`                 | text UNIQUE  | usado na rota pública `/agendar/:slug`       |
| `bio`                  | text         | exibido na página pública                    |
| `foto_url`             | text         |                                              |
| `telefone`             | text         |                                              |
| `cidade`               | text         |                                              |
| `registro_profissional`| text         | ex: CREFITO 12.345-F                         |
| `criado_em`            | timestamptz  | default now()                                |
| `atualizado_em`        | timestamptz  | auto-update via trigger                      |

**Índices:** `slug`, `user_id`.

**RLS:**
- Profissional lê/atualiza/insere APENAS seu próprio perfil (`auth.uid() = user_id`).
- **`Leitura pública do perfil por slug`** com `using (true)` — permite qualquer
  um consultar (necessário para a página pública). O front filtra por `slug` no `WHERE`.

**Trigger `atualizar_timestamp()`** — função reutilizada por todas as tabelas com
`atualizado_em` (fica definida em 001).

---

### 002 `contatos` (core)

Contato genérico. Não conter conceito clínico.

| Coluna            | Tipo         | Notas                                     |
| ----------------- | ------------ | ----------------------------------------- |
| `id`              | uuid PK      |                                           |
| `profissional_id` | uuid         | FK `profissionais(id)`, on delete cascade |
| `nome`            | text         | not null                                  |
| `telefone`        | text         |                                           |
| `email`           | text         |                                           |
| `criado_em`, `atualizado_em` | | ...                                       |

**Índices:** `profissional_id`, `(profissional_id, nome)`.

**RLS:** política única `FOR ALL` — profissional só vê `contatos` cujo
`profissional_id` bate com seu próprio `profissional.id`.

⚠️ **Não há política de INSERT público** — mas a página pública de agendamento
vai precisar criar `contatos` de pacientes novos. Ver `TODO(agendamento-publico)`.

---

### 003 `tipos_atendimento` (core)

Tipos de serviço que o profissional oferece (Sessão, Avaliação, Reavaliação...).

| Coluna            | Tipo          | Notas                                   |
| ----------------- | ------------- | --------------------------------------- |
| `id`              | uuid PK       |                                         |
| `profissional_id` | uuid          | FK, on delete cascade                   |
| `nome`            | text          | not null                                |
| `duracao_minutos` | integer       | default 60                              |
| `valor`           | numeric(10,2) | opcional                                |
| `ativo`           | boolean       | default true (soft delete)              |
| `cor`             | text          | adicionado em 009 (hex para o calendário) |

**RLS:**
- Profissional gerencia os seus (`FOR ALL`).
- **Leitura pública** dos tipos `ativo = true` (necessário na página pública).

**Soft delete:** `deleteTipoAtendimentoAction` seta `ativo = false` em vez de
deletar — preserva histórico de agendamentos.

---

### 004 `disponibilidades` (core)

Horário de atendimento por dia da semana. **Um registro por dia por profissional**
(unique constraint).

| Coluna            | Tipo     | Notas                                        |
| ----------------- | -------- | -------------------------------------------- |
| `id`              | uuid PK  |                                              |
| `profissional_id` | uuid     |                                              |
| `dia_semana`      | smallint | 0=Dom, 6=Sáb, check `between 0 and 6`        |
| `hora_inicio`     | time     |                                              |
| `hora_fim`        | time     |                                              |
| `ativo`           | boolean  | default true                                 |
| `duracao_slot`    | integer  | adicionado em 009 — intervalo entre slots (min) |

**Unique:** `(profissional_id, dia_semana)`.

**RLS:**
- Profissional gerencia (`FOR ALL`).
- Leitura pública dos `ativo = true` (para gerar slots na página pública).

---

### 005 `bloqueios` (core)

Períodos em que o profissional NÃO atende (viagem, feriado, consulta médica).

| Coluna              | Tipo        | Notas                                      |
| ------------------- | ----------- | ------------------------------------------ |
| `id`                | uuid PK     |                                            |
| `profissional_id`   | uuid        |                                            |
| `data_hora_inicio`  | timestamptz |                                            |
| `data_hora_fim`     | timestamptz |                                            |
| `motivo`            | text        |                                            |
| `criado_em`         | timestamptz |                                            |

**Check:** `data_hora_fim > data_hora_inicio`.

**RLS:**
- Profissional gerencia (`FOR ALL`).
- **`Leitura pública dos bloqueios` com `using (true)`** — expõe bloqueios ao
  mundo. Não é sensível (só é um "estou fora"), mas eventual dado no `motivo`
  vaza. Considerar restringir a `SELECT` sem coluna `motivo` para público.

---

### 006 `agendamentos` (core)

Agendamento em si.

**Enum criado nesta migration:**
```sql
create type public.status_agendamento as enum (
  'agendado', 'confirmado', 'cancelado', 'realizado', 'falta'
);
```
Reflete o `STATUS_AGENDAMENTO` em `src/constants/status.js` — manter sincronizado.

| Coluna                | Tipo                | Notas                                              |
| --------------------- | ------------------- | -------------------------------------------------- |
| `id`                  | uuid PK             |                                                    |
| `contato_id`          | uuid                | FK `contatos`, **on delete restrict** (protege histórico) |
| `profissional_id`     | uuid                | FK, cascade                                        |
| `tipo_atendimento_id` | uuid                | FK, **on delete set null** (preserva agendamento) |
| `data_hora`           | timestamptz         | not null                                           |
| `duracao_minutos`     | integer             | default 60                                         |
| `status`              | `status_agendamento`| default `'agendado'`                              |
| `notas`               | text                |                                                    |

**Índices:** `profissional_id`, `(profissional_id, data_hora)`, `contato_id`,
`(profissional_id, status)`.

**RLS:**
- Profissional gerencia (`FOR ALL`).
- **`Paciente pode criar agendamento` — `FOR INSERT WITH CHECK (true)`** —
  permite insert anônimo pela página pública. **Não** tem `WITH CHECK` restritivo,
  então qualquer um pode inserir agendamento em qualquer profissional se souber
  o `profissional_id`. Aceitável no MVP (a página pública já valida slug + slot);
  em produção seria bom apertar (rate-limit, captcha).

---

### 007 `pacientes` (vertical de saúde)

Estende `contatos` 1:1 com dados clínicos.

| Coluna            | Tipo        | Notas                                              |
| ----------------- | ----------- | -------------------------------------------------- |
| `id`              | uuid PK     |                                                    |
| `contato_id`      | uuid UNIQUE | FK `contatos`, cascade → 1:1 garantido pelo `UNIQUE` |
| `profissional_id` | uuid        | FK, cascade                                        |
| `data_nascimento` | date        |                                                    |
| `observacoes`     | text        |                                                    |
| `tags`            | text[]      | default `'{}'` — valores em `constants/tags.js`    |

**RLS:** profissional gerencia os seus (`FOR ALL`).

**Nota importante:** ao buscar paciente, o front SEMPRE faz `select` com
`contatos(...)` embutido para trazer nome/telefone/email juntos. Não duplicar
esses campos aqui — vive em `contatos`.

---

### 008 `anexos` (vertical de saúde)

Documentos do paciente (PDFs, imagens, áudios). Arquivo em Supabase Storage,
metadados na tabela.

| Coluna            | Tipo        | Notas                                    |
| ----------------- | ----------- | ---------------------------------------- |
| `id`              | uuid PK     |                                          |
| `paciente_id`     | uuid        | FK, cascade                              |
| `profissional_id` | uuid        | FK, cascade (denormalizado para RLS)     |
| `nome_arquivo`    | text        |                                          |
| `url_storage`     | text        | URL pública do bucket `anexos`           |
| `tipo_mime`       | text        |                                          |
| `tamanho_bytes`   | bigint      |                                          |

**Storage necessário:** bucket `anexos` (público). O upload é feito em
`useAnexos.js` com path `{profissional_id}/{paciente_id}/{timestamp}.ext`.

⚠️ Bucket público significa que **quem tiver a URL vê o arquivo**. Para
compartilhamento controlado, o composable oferece `gerarLinkCompartilhamento()`
que retorna signed URL com TTL — mas hoje a URL "crua" já é válida indefinidamente.
Considerar mudar bucket para **privado** e usar sempre signed URLs.

---

### 009 `campos_extras`

Duas colunas adicionadas depois:

- `tipos_atendimento.cor text` — hex/nome para colorir no calendário.
- `disponibilidades.duracao_slot integer default 60` — intervalo entre slots.
  Lido em `useDisponibilidade.gerarSlotsDisponiveis()`.

---

## RLS em uma frase

**"Profissional só vê o que é seu, e a página pública só lê perfil/tipos ativos/disponibilidades/bloqueios."**

Nenhuma tabela usa `service_role` no cliente — o front usa `anon key` e depende
100% do RLS. Se um dia precisar bypassar RLS (envio de lembretes automáticos,
por exemplo), fazer via **Supabase Edge Function** com `service_role`, nunca
expor a chave no front.

---

## Convenções

- **UUID em tudo** — `gen_random_uuid()` como default.
- **`timestamptz`** — nunca `timestamp` sem timezone.
- **`atualizado_em`** — em toda tabela editável, com trigger `atualizar_timestamp`.
- **Nomes de tabela em pt-BR minúsculas plurais** (`profissionais`, `agendamentos`).
- **Nomes de coluna em pt-BR snake_case** (`data_nascimento`, `nome_completo`).
- **Cascade explícita:** cascade quando o filho não faz sentido sem o pai;
  `restrict` para proteger histórico (ex: `agendamentos.contato_id`);
  `set null` quando o registro sobrevive à perda da referência
  (ex: `agendamentos.tipo_atendimento_id`).

---

## Como criar uma migration nova

1. Descobrir o próximo número (hoje `009` é o último → próxima é `010`).
2. Criar `supabase/migrations/010_descricao.sql` seguindo o estilo:
   ```sql
   -- Migration 010: descrição curta

   alter table public.X
     add column if not exists ...;

   -- ou create table ...
   -- lembrar de: trigger de atualizado_em, RLS, políticas, índices
   ```
3. Rodar no **SQL Editor** do Supabase (production) e commitar o arquivo.
4. Se envolver alteração incompatível, coordenar com o time (a policy do
   deploy Vercel é main = produção).
