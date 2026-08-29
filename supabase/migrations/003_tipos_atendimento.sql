-- Migration 003: Tipos de atendimento (CORE genérico)

create table public.tipos_atendimento (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null references public.profissionais(id) on delete cascade,
  nome             text not null,
  duracao_minutos  integer not null default 60,
  valor            numeric(10, 2),
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index idx_tipos_atendimento_profissional on public.tipos_atendimento (profissional_id);

create trigger trg_tipos_atendimento_atualizado_em
  before update on public.tipos_atendimento
  for each row execute function public.atualizar_timestamp();

-- RLS
alter table public.tipos_atendimento enable row level security;

create policy "Profissional gerencia seus tipos de atendimento"
  on public.tipos_atendimento for all
  using (
    profissional_id in (
      select id from public.profissionais where user_id = auth.uid()
    )
  );

-- Leitura pública (para a página de agendamento do paciente)
create policy "Leitura pública dos tipos ativos"
  on public.tipos_atendimento for select
  using (ativo = true);
