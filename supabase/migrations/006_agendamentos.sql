-- Migration 006: Agendamentos (CORE genérico)
-- IMPORTANTE: referencia contatos, NUNCA pacientes

create type public.status_agendamento as enum (
  'agendado',
  'confirmado',
  'cancelado',
  'realizado',
  'falta'
);

create table public.agendamentos (
  id                    uuid primary key default gen_random_uuid(),
  contato_id            uuid not null references public.contatos(id) on delete restrict,
  profissional_id       uuid not null references public.profissionais(id) on delete cascade,
  tipo_atendimento_id   uuid references public.tipos_atendimento(id) on delete set null,
  data_hora             timestamptz not null,
  duracao_minutos       integer not null default 60,
  status                public.status_agendamento not null default 'agendado',
  notas                 text,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

-- Índices de consulta frequente
create index idx_agendamentos_profissional on public.agendamentos (profissional_id);
create index idx_agendamentos_data_hora on public.agendamentos (profissional_id, data_hora);
create index idx_agendamentos_contato on public.agendamentos (contato_id);
create index idx_agendamentos_status on public.agendamentos (profissional_id, status);

create trigger trg_agendamentos_atualizado_em
  before update on public.agendamentos
  for each row execute function public.atualizar_timestamp();

-- RLS
alter table public.agendamentos enable row level security;

create policy "Profissional gerencia seus agendamentos"
  on public.agendamentos for all
  using (
    profissional_id in (
      select id from public.profissionais where user_id = auth.uid()
    )
  );

-- Inserção pública (paciente agendando via página pública)
create policy "Paciente pode criar agendamento"
  on public.agendamentos for insert
  with check (true);
