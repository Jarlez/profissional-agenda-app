-- Migration 007: Pacientes (VERTICAL de saúde)
-- Estende contatos com dados clínicos — relação 1:1 via contato_id

create table public.pacientes (
  id               uuid primary key default gen_random_uuid(),
  contato_id       uuid not null unique references public.contatos(id) on delete cascade,
  profissional_id  uuid not null references public.profissionais(id) on delete cascade,
  data_nascimento  date,
  observacoes      text,
  tags             text[] not null default '{}',
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index idx_pacientes_profissional on public.pacientes (profissional_id);
create index idx_pacientes_contato on public.pacientes (contato_id);

create trigger trg_pacientes_atualizado_em
  before update on public.pacientes
  for each row execute function public.atualizar_timestamp();

-- RLS
alter table public.pacientes enable row level security;

create policy "Profissional gerencia seus pacientes"
  on public.pacientes for all
  using (
    profissional_id in (
      select id from public.profissionais where user_id = auth.uid()
    )
  );
