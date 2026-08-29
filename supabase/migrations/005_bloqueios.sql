-- Migration 005: Bloqueios de horário (CORE genérico)

create table public.bloqueios (
  id                 uuid primary key default gen_random_uuid(),
  profissional_id    uuid not null references public.profissionais(id) on delete cascade,
  data_hora_inicio   timestamptz not null,
  data_hora_fim      timestamptz not null,
  motivo             text,
  criado_em          timestamptz not null default now(),

  constraint bloqueio_periodo_valido check (data_hora_fim > data_hora_inicio)
);

create index idx_bloqueios_profissional on public.bloqueios (profissional_id);
create index idx_bloqueios_periodo on public.bloqueios (profissional_id, data_hora_inicio, data_hora_fim);

-- RLS
alter table public.bloqueios enable row level security;

create policy "Profissional gerencia seus bloqueios"
  on public.bloqueios for all
  using (
    profissional_id in (
      select id from public.profissionais where user_id = auth.uid()
    )
  );

-- Leitura pública (para não mostrar horários bloqueados na página de agendamento)
create policy "Leitura pública dos bloqueios"
  on public.bloqueios for select
  using (true);
