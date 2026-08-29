-- Migration 004: Disponibilidades semanais (CORE genérico)

create table public.disponibilidades (
  id               uuid primary key default gen_random_uuid(),
  profissional_id  uuid not null references public.profissionais(id) on delete cascade,
  dia_semana       smallint not null check (dia_semana between 0 and 6), -- 0=Dom, 6=Sab
  hora_inicio      time not null,
  hora_fim         time not null,
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),

  -- Apenas um registro por dia por profissional
  unique (profissional_id, dia_semana)
);

create index idx_disponibilidades_profissional on public.disponibilidades (profissional_id);

create trigger trg_disponibilidades_atualizado_em
  before update on public.disponibilidades
  for each row execute function public.atualizar_timestamp();

-- RLS
alter table public.disponibilidades enable row level security;

create policy "Profissional gerencia suas disponibilidades"
  on public.disponibilidades for all
  using (
    profissional_id in (
      select id from public.profissionais where user_id = auth.uid()
    )
  );

-- Leitura pública (para gerar slots na página de agendamento)
create policy "Leitura pública das disponibilidades"
  on public.disponibilidades for select
  using (ativo = true);
